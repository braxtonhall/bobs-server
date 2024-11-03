import { db } from "../../db";
import { z } from "zod";

export const updateWatchlistInputSchema = z.object({
	episodes: z.array(z.string()),
	watchlistId: z.string(),
	filters: z.record(z.string(), z.unknown()),
	name: z.string(),
	tags: z.array(z.string()),
	description: z.string(),
});

export const updateWatchlist = async (ownerId: string, watchlist: z.infer<typeof updateWatchlistInputSchema>) => {
	const { episodes } = await db.watchlist.findUniqueOrThrow({
		where: {
			id: watchlist.watchlistId,
			ownerId,
		},
		select: {
			episodes: {
				select: {
					id: true,
				},
			},
		},
	});
	return db.watchlist.update({
		where: {
			id: watchlist.watchlistId,
			ownerId,
		},
		data: {
			name: watchlist.name,
			description: watchlist.description,
			filters: JSON.stringify(watchlist.filters),
			tags: {
				connectOrCreate: watchlist.tags.map((name) => ({
					where: { name },
					create: { name },
				})),
			},
			episodes: {
				disconnect: episodes,
				connect: watchlist.episodes.map((id) => ({
					id,
				})),
			},
		},
	});
};