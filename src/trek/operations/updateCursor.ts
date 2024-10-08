import { db } from "../../db";

export const updateCursor = async (env: { viewerId: string; episodeId: string | null }) => {
	if (env.episodeId === null) {
		await db.viewer.update({
			where: {
				id: env.viewerId,
			},
			data: {
				currentId: null,
			},
		});
	} else {
		await db.viewer.update({
			where: {
				id: env.viewerId,
				watching: {
					episodes: {
						some: {
							id: env.episodeId,
						},
					},
				},
			},
			data: {
				currentId: env.episodeId,
			},
		});
	}
};
