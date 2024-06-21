import { db, transaction } from "../../db";
import { SeasonState } from "../SeasonState";
import { EmailPersona, enqueue, Message, sendQueuedMessages } from "../../email";
import Config from "../../Config";
import { getUnsubLink } from "../../auth/operations";
import { Entry } from "@prisma/client";
import ejs from "ejs";
import { Deadlines } from "../schemas";
import { assertDeadlinesAreReasonable } from "../util/assertDeadlinesAreReasonable";

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
	deadlines: Deadlines;
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

const toMessages = (seasonId: string, entries: UpdatedEntry[], softDeadline: Date | null): Promise<Message[]> => {
	const link = `https://${Config.HOST}/login?next=${encodeURIComponent(`/secret-dj/games/${seasonId}`)}`;
	const futureMessages = entries
		.filter(({ recipient }) => recipient.email.subscribed)
		.map(async ({ recipient }) => {
			const { link: unsub } = await getUnsubLink(recipient.email.address);
			const html = await ejs.renderFile("views/emails/started.ejs", {
				name: recipient.name,
				gameLink: link,
				unsubLink: unsub.toString(),
				softDeadline,
			});
			return {
				persona: EmailPersona.SECRET_DJ,
				address: recipient.email.address,
				html: html,
				subject: "a new season of secret dj has started",
			};
		});
	return Promise.all(futureMessages);
};

export const startGame = async ({ ownerId, seasonId, deadlines }: Environment) =>
	transaction(async () => {
		assertDeadlinesAreReasonable(deadlines);

		const season = await db.season.update({
			where: { id: seasonId, ownerId, state: SeasonState.SIGN_UP },
			select: { entries: true, id: true },
			data: {
				state: SeasonState.IN_PROGRESS,
				...deadlines,
			},
		});
		if (season && season.entries.length > 0) {
			const pairs = pairEntries(season.entries);
			const futureUpdates = pairs.map(async (pair) => {
				const entry = await db.entry.update({
					where: { id: pair.recipient.id },
					data: { djId: pair.dj.recipientId },
					include: {
						recipient: {
							select: {
								email: { select: { address: true, subscribed: true } },
								name: true,
							},
						},
						dj: {
							select: {
								email: { select: { id: true } },
							},
						},
						box: {
							select: { id: true },
						},
					},
				});
				const subscriptionId = {
					boxId: entry.box.id,
					emailId: entry.dj!.email.id,
				};
				await db.subscription.upsert({
					where: { id: subscriptionId },
					create: subscriptionId,
					update: {},
				});
				return entry;
			});
			const updates = (await Promise.all(futureUpdates)) satisfies UpdatedEntry[];
			await enqueue(...(await toMessages(season.id, updates, deadlines.softDeadline)));
			return updates;
		} else {
			throw new Error(`Could not find eligible season ${seasonId}`);
		}
	}).finally(() => void sendQueuedMessages());
