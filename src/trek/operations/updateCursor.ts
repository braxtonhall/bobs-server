import { db, transaction } from "../../db";

export const updateCursor = (env: { viewerId: string; episodeId: string | null }) =>
	transaction(async () => {
		if (env.episodeId !== null) {
			const { watching } = await db.viewer.findUniqueOrThrow({
				where: {
					id: env.viewerId,
				},
				select: {
					watching: {
						select: {
							episodes: {
								where: {
									id: env.episodeId,
								},
							},
						},
					},
				},
			});
			if (!watching?.episodes.length) {
				throw new Error("Not currently watching this episode");
			}
		}
		await db.viewer.update({
			where: {
				id: env.viewerId,
			},
			data: {
				currentId: env.episodeId,
			},
		});
	});
