import { db } from "../../db";

export const getWatchlist = async ({ watchlistId, viewerId }: { watchlistId: string; viewerId: string }) => {
	const watchlist = await db.watchlist.findUnique({
		where: {
			id: watchlistId,
		},
		include: {
			episodes: {
				select: { id: true },
			},
			owner: {
				select: { name: true },
			},
			viewings: {
				where: {
					viewerId,
				},
				include: {
					startedAt: true,
					finishedAt: true,
				},
			},
		},
	});
	if (watchlist) {
		return {
			watchlist,
			owner: watchlist.ownerId === viewerId,
		};
	} else {
		return null;
	}
};
