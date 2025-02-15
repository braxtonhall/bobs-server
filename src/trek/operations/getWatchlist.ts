import { db } from "../../db.js";
import { ViewingState } from "../types.js";

export const getWatchlist = async ({ watchlistId, viewerId }: { watchlistId: string; viewerId?: string }) =>
	db.watchlist
		.findUniqueOrThrow({
			where: {
				id: watchlistId,
			},
			include: {
				entries: {
					select: { episodeId: true },
					orderBy: { rank: "asc" },
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
