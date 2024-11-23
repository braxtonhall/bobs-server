import { db } from "../../db";

export const setWatchlistLiked = ({
	viewerId,
	watchlistId,
	liked,
}: {
	viewerId: string;
	watchlistId: string;
	liked: boolean;
}) => {
	if (liked) {
		return db.watchlistLike.upsert({
			where: { viewerId_watchlistId: { viewerId, watchlistId } },
			create: {
				viewer: { connect: { id: viewerId } },
				watchlist: { connect: { id: watchlistId } },
				createdAt: { create: {} },
			},
			update: {},
		});
	} else {
		return db.watchlistLike.delete({ where: { viewerId_watchlistId: { viewerId, watchlistId } } });
	}
};
