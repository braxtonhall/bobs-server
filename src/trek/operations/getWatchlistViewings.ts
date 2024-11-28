import { db } from "../../db";
import Config from "../../Config";

export const getWatchlistViewings = async ({
	watchlistId,
	cursor,
	viewerId,
}: {
	watchlistId: string;
	cursor?: string;
	viewerId: string;
}) => {
	const watchlist = await db.watchlist.findUnique({
		where: {
			id: watchlistId,
		},
		select: {
			viewings: {
				where: {
					viewerId,
				},
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: { startedAtId: "desc" },
				take: Config.DEFAULT_PAGE_SIZE + 1,
			},
		},
	});
	const viewings = watchlist?.viewings ?? [];
	if (viewings.length > Config.DEFAULT_PAGE_SIZE) {
		return {
			viewings: viewings.slice(0, Config.DEFAULT_PAGE_SIZE),
			cursor: viewings[Config.DEFAULT_PAGE_SIZE].id as string | undefined,
		};
	} else {
		return {
			viewings,
			cursor: undefined as string | undefined,
		};
	}
};
