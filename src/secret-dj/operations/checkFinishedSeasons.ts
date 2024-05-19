import { Entry } from "@prisma/client";
import { db } from "../../db";
import { getAllEntriesForGame } from "./getAllEntriesForGame";
import { SeasonState } from "../SeasonState";

export const checkFinishedSeasons = async () => {
	const inProgressGames = await db.season.findMany({
		where: {
			state: SeasonState.IN_PROGRESS,
		},
		select: {
			id: true,
		},
	});

	const inProgressGameEntries: Entry[][] = await Promise.all(
		inProgressGames.map((game) => getAllEntriesForGame({ seasonId: game.id })),
	);

	const finishedSeasons = [];
	for (const seasonEntries of inProgressGameEntries) {
		// this only runs for in progress games which should have been explicitly started by the game owner
		// so REALLY there should be at least one entry, but check just in case
		if (!seasonEntries.length) {
			continue;
		}
		// now we can assume there's at least one entry to get the seasonId
		const seasonId = seasonEntries[0].seasonId;
		if (seasonEntries.every((entry) => !!entry.submissionUrl)) {
			// every entry in this season has a submissionUrl (playlist)
			finishedSeasons.push(seasonId);
		}
	}

	return await Promise.all(finishedSeasons.map((seasonId) => endSeason(seasonId)));
};

const endSeason = async (seasonId: number) =>
	await db.season.update({
		where: {
			id: seasonId,
		},
		data: {
			state: SeasonState.ENDED,
		},
	});
