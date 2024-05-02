import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	seasonId: number;
	djId: number;
	playlistUrl: string;
};

export const submitPlaylist = async ({ seasonId, djId, playlistUrl }: Environment): Promise<void> => {
	const entry = await db.entry.findFirst({
		where: {
			seasonId,
			djId,
		},
		select: {
			id: true,
			season: {
				select: {
					state: true,
				},
			},
		},
	});
	if (entry === null) {
		throw new Error(`Entry for season id ${seasonId} does not exist`);
	}
	const result = await db.entry.update({
		where: { id: entry.id, season: { state: SeasonState.IN_PROGRESS } },
		data: { submissionUrl: playlistUrl },
	});
	if (result === null) {
		throw new Error(`Season ${seasonId} is not in progress and cannot be updated`);
	}
};
