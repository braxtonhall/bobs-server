import { Entry } from "@prisma/client";
import { db } from "../../../db";
import { SeasonState } from "../../SeasonState";
import { getAllEntriesForGame } from "../getAllEntriesForGame";

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

	const updatedSeasons = await Promise.all(finishedSeasons.map((seasonId) => endSeason(seasonId)));
	return updatedSeasons;
};

const endSeason = async (seasonId: number) => {
	const updatedSeason = await db.season.update({
		where: {
			id: seasonId,
		},
		data: {
			state: SeasonState.ENDED,
		},
	});
	return updatedSeason;
};

const FOUR_HOURS = 4 * 60 * 60 * 1000;

// assumes the server will be up for at least 4 hours
setInterval(() => {
	checkFinishedSeasons();
}, FOUR_HOURS);
