import { db } from "../../db.js";
import { ViewingState } from "../types.js";
import Config from "../../Config.js";

export const getCurrentlyWatching = async (viewerId: string, cursor: string | undefined) => {
	const viewings = await db.viewing.findMany({
		where: {
			viewerId,
			state: ViewingState.IN_PROGRESS,
		},
		cursor: cursor ? { id: cursor } : undefined,
		take: Config.DEFAULT_PAGE_SIZE + 1,
		orderBy: {
			startedAtId: "desc",
		},
		select: {
			id: true,
			cursor: true,
			watchlist: {
				include: {
					entries: {
						select: {
							episodeId: true,
						},
						orderBy: { rank: "asc" },
					},
				},
			},
		},
	});
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
