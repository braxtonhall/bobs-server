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
			reviewCount: Number(episode.reviewCount),
			opinionCount: Number(episode.opinionCount),
			oneCount: Number(episode.oneCount),
			twoCount: Number(episode.twoCount),
			threeCount: Number(episode.threeCount),
			fourCount: Number(episode.fourCount),
			fiveCount: Number(episode.fiveCount),
			sixCount: Number(episode.sixCount),
			sevenCount: Number(episode.sevenCount),
			eightCount: Number(episode.eightCount),
			nineCount: Number(episode.nineCount),
			tenCount: Number(episode.tenCount),
		};
	} else {
		return null;
	}
};
