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
			tags: true,
			_count: {
				select: {
					viewings: {
						where: {
							viewerId,
						},
					},
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
