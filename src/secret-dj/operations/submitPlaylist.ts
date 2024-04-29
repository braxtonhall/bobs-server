import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	season: number;
	dj: number;
	playlist: string;
};

export const submitPlaylist = async ({ season, dj, playlist }: Environment) => {
	const entry = await db.entry.findFirst({
		where: {
			seasonId: season,
			djId: dj,
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
		throw new Error(`Entry for season id ${season} does not exist`);
	}
	const result = await db.entry.update({
		where: { id: entry.id, season: { state: SeasonState.IN_PROGRESS } },
		data: { submissionUrl: playlist },
		select: {},
	});
	if (result === null) {
		throw new Error(`Season ${season} is not in progress and cannot be updated`);
	}
};
