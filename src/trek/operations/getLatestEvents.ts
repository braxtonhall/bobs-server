import { db } from "../../db";
import { Scope } from "../types";

const PAGE_SIZE = 100;

export const getLatestEvents = async ({ cursor }: { cursor?: number; viewerId: string; scope: Scope }) => {
	const events = await db.event.findMany({
		cursor: cursor ? { id: cursor } : undefined,
		orderBy: { id: "desc" },
		take: PAGE_SIZE + 1,
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
	if (events.length > PAGE_SIZE) {
		return {
			events: events.slice(0, PAGE_SIZE),
			cursor: events[PAGE_SIZE].id as number | undefined,
		};
	} else {
		return {
			events,
			cursor: undefined as number | undefined,
		};
	}
};
