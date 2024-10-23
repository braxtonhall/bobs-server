import { db } from "../../db";

export const getEpisode = ({
	viewerId,
	seriesId,
	season,
	production,
}: {
	viewerId: string;
	seriesId: string;
	production: number;
	season: number;
}) =>
	db.episode.findUnique({
		where: {
			seriesId_season_production: {
				seriesId,
				season,
				production,
			},
		},
		include: {
			opinions: { where: { viewerId } },
			_count: { select: { views: { where: { viewerId } } } },
		},
	});
