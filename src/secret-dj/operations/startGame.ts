import { db } from "../../db";
import { SeasonState } from "../SeasonState";
import { enqueue, Message } from "../../email";
import Config from "../../Config";
import { getUnsubLink } from "../../auth/operations";

type Entry = Awaited<ReturnType<typeof db.entry.findMany>>[number];

type Pair = { recipient: Entry; dj: Entry };

const shuffle = <T>(array: T[]): T[] => {
	const shuffleArray = [...array];
	for (let i = shuffleArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffleArray[i], shuffleArray[j]] = [shuffleArray[j], shuffleArray[i]];
	}
	return shuffleArray;
};

const pairEntries = (users: Entry[]): Pair[] => {
	const shuffledUsers = shuffle(users);
	const pairs: Pair[] = [];
	for (let i = 0; i < shuffledUsers.length; i = i + 1) {
		const dj = shuffledUsers[i];
		const recipient = shuffledUsers[(i + 1) % shuffledUsers.length];
		pairs.push({ dj, recipient });
	}
	return pairs;
};

type Environment = {
	ownerId: string;
	seasonId: string;
};

type UpdatedEntry = {
	recipient: {
		name: string;
		email: {
			address: string;
			subscribed: boolean;
		};
	};
};

const toMessages = (
	tx: Pick<typeof db, "message" | "token">,
	seasonId: string,
	entries: UpdatedEntry[],
): Promise<Message[]> => {
	const link = `https://${Config.HOST}/secret-dj/games/${seasonId}`;
	const futureMessages = entries
		.filter(({ recipient }) => recipient.email.subscribed)
		.map(async ({ recipient }) => {
			const { link: unsub } = await getUnsubLink(tx, recipient.email.address);
			return {
				address: recipient.email.address,
				html: `${recipient.name}, time to start making playlist. <a href="${link}">click here to see your rules</a>. <a href="${unsub.toString()}">unsubscribe</a>`,
				subject: "a new season of secret dj has started",
			};
		});
	return Promise.all(futureMessages);
};

export const startGame = async ({ ownerId, seasonId }: Environment): Promise<Entry[]> =>
	db.$transaction(async (tx) => {
		const season = await tx.season.update({
			where: { id: seasonId, ownerId, state: SeasonState.SIGN_UP },
			select: { entries: true, id: true },
			data: { state: SeasonState.IN_PROGRESS },
		});
		if (season && season.entries.length > 0) {
			const pairs = pairEntries(season.entries);
			const futureUpdates = pairs.map((pair) =>
				tx.entry.update({
					where: { id: pair.recipient.id },
					data: { djId: pair.dj.recipientId },
					include: {
						recipient: {
							select: {
								email: { select: { address: true, subscribed: true } },
								name: true,
							},
						},
					},
				}),
			);
			const updates = (await Promise.all(futureUpdates)) satisfies UpdatedEntry[];
			// TODO should be a way to opt out of these emails
			await enqueue(tx, ...(await toMessages(tx, season.id, updates)));
			return updates;
		} else {
			throw new Error(`Could not find eligible season ${seasonId}`);
		}
	});
