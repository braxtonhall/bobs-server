import { db } from "../../db";
import { ViewingState } from "../types";

export const getWatchlist = async ({ watchlistId, viewerId }: { watchlistId: string; viewerId?: string }) =>
	db.watchlist
		.findUniqueOrThrow({
			where: {
				id: watchlistId,
			},
			include: {
				episodes: {
					select: { id: true },
				},
				owner: {
					select: { name: true, id: true },
				},
				createdAt: true,
				tags: true,
				_count: {
					select: {
						viewings: {
							where: {
								state: ViewingState.FINISHED,
							},
						},
						likes: true,
					},
				},
			},
		})
		.then((watchlist) => ({
			watchlist,
			owner: watchlist.ownerId === viewerId,
		}))
		.catch(() => null);
