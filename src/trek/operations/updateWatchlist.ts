import { db } from "../../db";
import { z } from "zod";

export const updateWatchlistInputSchema = z.object({
	episodes: z.array(z.string()),
	watchlistId: z.string(),
	name: z.string(),
	tags: z.array(z.string()),
	description: z.string(),
});

export const updateWatchlist = async (ownerId: string, watchlist: z.infer<typeof updateWatchlistInputSchema>) => {
	return db.watchlist.update({
		where: {
			id: watchlist.watchlistId,
			ownerId,
		},
		data: {
			name: watchlist.name,
			description: watchlist.description,
			tags: {
				set: [],
				connectOrCreate: watchlist.tags.map((name) => ({
					where: { name },
					create: { name },
				})),
			},
			entries: {
				deleteMany: {},
				create: watchlist.episodes.map((episodeId, rank) => ({
					episodeId,
					rank,
				})),
			},
		},
	});
};
