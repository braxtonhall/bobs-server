import { db } from "../../db";
import { ViewingState } from "../types";

const PAGE_SIZE = 10;

export const getCurrentlyWatching = async (viewerId: string, cursor: string | undefined) => {
	const viewings = await db.viewing.findMany({
		where: {
			viewerId,
			state: ViewingState.IN_PROGRESS,
		},
		cursor: cursor ? { id: cursor } : undefined,
		take: PAGE_SIZE + 1,
		orderBy: {
			startedAt: {
				time: "desc",
			},
		},
		select: {
			id: true,
			cursor: true,
			watchlist: {
				include: {
					episodes: {
						select: {
							id: true,
						},
					},
				},
			},
		},
	});
	if (viewings.length > PAGE_SIZE) {
		return {
			viewings: viewings.slice(0, PAGE_SIZE),
			cursor: viewings[PAGE_SIZE].id as string | undefined,
		};
	} else {
		return {
			viewings,
			cursor: undefined as string | undefined,
		};
	}
};
