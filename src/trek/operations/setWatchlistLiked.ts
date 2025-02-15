import { db, transaction } from "../../db.js";

export const setWatchlistLiked = async ({
	viewerId,
	watchlistId,
	liked,
}: {
	viewerId: string;
	watchlistId: string;
	liked: boolean;
}) => {
	if (liked) {
		await db.watchlistLike.upsert({
			where: { viewerId_watchlistId: { viewerId, watchlistId } },
			create: {
				viewer: { connect: { id: viewerId } },
				watchlist: { connect: { id: watchlistId } },
				createdAt: { create: {} },
			},
			update: {},
		});
	} else {
		await transaction(async () => {
			const { createdAtId } = await db.watchlistLike.delete({
				where: { viewerId_watchlistId: { viewerId, watchlistId } },
			});
			await db.event.delete({ where: { id: createdAtId } });
		});
	}
};
