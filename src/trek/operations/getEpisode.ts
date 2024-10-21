import { db } from "../../db";

export const getEpisode = ({ viewerId, episodeId }: { viewerId: string; episodeId: string }) =>
	db.episode.findUnique({
		where: { id: episodeId },
		include: {
			opinions: { where: { viewerId } },
			_count: { select: { views: { where: { viewerId } } } },
		},
	});
