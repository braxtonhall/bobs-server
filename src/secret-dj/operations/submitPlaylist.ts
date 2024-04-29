import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	season: number;
	dj: number;
	playlist: string;
};

const submitPlaylist = async ({ season, dj, playlist }: Environment) => {
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
		// TODO
	} else if (entry.season.state !== SeasonState.IN_PROGRESS)
		if (entry) {
			await db.entry.update({
				where: { id: entry.id },
				data: { submissionUrl: playlist },
			});
		} else {
			// TODO
		}
};
