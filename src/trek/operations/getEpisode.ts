import { db } from "../../db";
import { getEpisode as getEpisodeQuery } from "@prisma/client/sql";

export const getEpisode = async ({
	viewerId,
	seriesId,
	season,
	production,
}: {
	viewerId: string;
	seriesId: string;
	production: number;
	season: number;
}) => {
	const results = await db.$queryRawTyped(getEpisodeQuery(viewerId, seriesId, season, production));
	if (results[0]) {
		const episode = results[0];
		return {
			...episode,
			view_count: Number(episode.view_count),
			count_0: Number(episode.count_0),
			count_1: Number(episode.count_1),
			count_2: Number(episode.count_2),
			count_3: Number(episode.count_3),
			count_4: Number(episode.count_4),
			count_5: Number(episode.count_5),
			count_6: Number(episode.count_6),
			count_7: Number(episode.count_7),
			count_8: Number(episode.count_8),
			count_9: Number(episode.count_9),
		};
	} else {
		return null;
	}
};
