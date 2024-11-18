import { db } from "../../db";
import Config from "../../Config";

export const getWatchlistTags = async ({ watchlistId, cursor }: { watchlistId: string; cursor?: string }) => {
	const watchlist = await db.watchlist.findUnique({
		where: {
			id: watchlistId,
		},
		select: {
			tags: {
				cursor: cursor ? { name: cursor } : undefined,
				orderBy: { name: "desc" },
				take: Config.DEFAULT_PAGE_SIZE + 1,
			},
		},
	});
	const tags = watchlist?.tags ?? [];
	if (tags.length > Config.DEFAULT_PAGE_SIZE) {
		return {
			tags: tags.slice(0, Config.DEFAULT_PAGE_SIZE),
			cursor: tags[Config.DEFAULT_PAGE_SIZE].name as string | undefined,
		};
	} else {
		return {
			tags,
			cursor: undefined as string | undefined,
		};
	}
};
