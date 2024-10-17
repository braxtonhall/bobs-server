import { db } from "../../db";

export const getEpisodes = async (viewerId: string) =>
	db.episode.findMany({
		include: {
			opinions: { where: { viewerId } },
			_count: { select: { views: { where: { viewerId } } } },
		},
	});
