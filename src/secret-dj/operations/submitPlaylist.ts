import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	seasonId: string;
	djId: number;
	playlistUrl: string;
};

export const submitPlaylist = async ({ seasonId, djId, playlistUrl }: Environment): Promise<void> => {
	const result = await db.entry.updateMany({
		where: { djId, season: { state: SeasonState.IN_PROGRESS, userId: seasonId } },
		data: { submissionUrl: playlistUrl },
	});
	if (result.count === 0) {
		throw new Error(`Season ${seasonId} is not in progress and cannot be updated`);
	}
};
