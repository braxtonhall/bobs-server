import { db, transaction } from "../../db";

export const incrementCursor = async (env: { viewerId: string; viewingId: string }) =>
	transaction(async () => {
		const { watchlistId, cursor } = await db.viewing.findUniqueOrThrow({
			where: { id: env.viewingId },
			select: { watchlistId: true, cursor: true },
		});
		if (cursor) {
			const { entries } = await db.watchlist.findUniqueOrThrow({
				where: {
					id: watchlistId,
				},
				include: {
					entries: {
						cursor: {
							watchlistId_episodeId: {
								watchlistId,
								episodeId: cursor,
							},
						},
						orderBy: { rank: "asc" },
						take: 1,
						skip: 1,
					},
				},
			});
			await updateCursor({
				viewerId: env.viewerId,
				episodeId: entries[0]?.episodeId ?? null,
				viewingId: env.viewingId,
			});
		}
	});

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
					entries: {
						some: {
							episodeId: env.episodeId,
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
