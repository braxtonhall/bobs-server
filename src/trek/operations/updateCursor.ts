import { db } from "../../db";

export const updateCursor = async (env: { viewerId: string; viewingId: string; episodeId: string | null }) => {
	if (env.episodeId === null) {
		await db.viewing.update({
			where: {
				viewerId: env.viewerId,
				id: env.viewingId,
			},
			data: {
				cursor: null,
			},
		});
	} else {
		await db.viewing.update({
			where: {
				viewerId: env.viewerId,
				id: env.viewingId,
				watchlist: {
					episodes: {
						some: {
							id: env.episodeId,
						},
					},
				},
			},
			data: {
				cursor: env.episodeId,
			},
		});
	}
};
