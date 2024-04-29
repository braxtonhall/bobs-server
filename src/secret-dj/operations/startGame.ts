import { db } from "../../db";
import { SeasonState } from "../SeasonState";

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

export const startGame = async (seasonId: number) => {
	const result = await db.season.findUnique({ where: { id: seasonId }, select: { entries: true } });
	if (result) {
		const pairs = pairEntries(result.entries);
		await db.$transaction(async (tx) => {
			const season = await tx.season.update({
				where: { id: seasonId, state: SeasonState.SIGN_UP },
				data: { state: SeasonState.IN_PROGRESS },
			});
			if (season) {
				const updates = pairs.map((pair) =>
					tx.entry.update({ where: { id: pair.recipient.id }, data: { djId: pair.dj.djId } }),
				);
				return Promise.all(updates);
			} else {
				throw new Error(`Season ${seasonId} is not in progress`);
			}
		});
		// TODO for each person, send a notification
	} else {
		throw new Error(`Season for id ${seasonId} does not exist`);
	}
};
