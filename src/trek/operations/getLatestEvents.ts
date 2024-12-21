import { db } from "../../db";
import { Scope } from "../types";
import Config from "../../Config";

// TODO use the scope!!!
export const getLatestEvents = async ({ cursor }: { cursor?: number; viewerId?: string; scope: Scope }) => {
	const events = await db.event.findMany({
		cursor: cursor ? { id: cursor } : undefined,
		orderBy: { id: "desc" },
		take: Config.DEFAULT_PAGE_SIZE + 1,
		select: {
			id: true,
			time: true,
			view: {
				include: {
					viewer: true,
					episode: true,
				},
			},
			watchlist: {
				include: {
					owner: true,
				},
			},
			startedViewing: {
				include: {
					viewer: true,
					watchlist: true,
				},
			},
			finishedViewing: {
				include: {
					viewer: true,
					watchlist: true,
				},
			},
			viewLike: {
				select: {
					viewer: true,
					view: {
						select: {
							viewer: true,
						},
					},
				},
			},
			watchlistLike: {
				select: {
					viewer: true,
					watchlist: true,
				},
			},
			follow: {
				select: {
					follower: true,
					followed: true,
				},
			},
			viewer: true,
		},
	});
	if (events.length > Config.DEFAULT_PAGE_SIZE) {
		return {
			events: events.slice(0, Config.DEFAULT_PAGE_SIZE),
			cursor: events[Config.DEFAULT_PAGE_SIZE].id as number | undefined,
		};
	} else {
		return {
			events,
			cursor: undefined as number | undefined,
		};
	}
};
