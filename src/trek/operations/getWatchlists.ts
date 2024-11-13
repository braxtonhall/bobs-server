import { db } from "../../db";
import Config from "../../Config";
import { ViewingState } from "../types";

export const getWatchlists = async ({
	requestorId,
	targetId,
	cursor,
}: {
	requestorId?: string;
	targetId: string;
	cursor?: string;
}) => {
	const watchlists = await db.watchlist.findMany({
		cursor: cursor ? { id: cursor } : undefined,
		where: {
			ownerId: targetId,
		},
		orderBy: { createdAtId: "desc" },
		take: Config.DEFAULT_PAGE_SIZE + 1,
		include: {
			owner: true,
			createdAt: true,
			...(requestorId
				? {
						likes: { where: { viewerId: requestorId } },
						viewings: {
							where: {
								viewerId: requestorId,
								NOT: { state: ViewingState.FINISHED },
							},
							select: { id: true },
							take: 1,
						},
					}
				: {}),
			_count: {
				select: {
					episodes: true,
					...(requestorId
						? {
								viewings: {
									where: {
										viewerId: requestorId,
										state: ViewingState.FINISHED,
									},
								},
							}
						: {}),
				},
			},
		},
	});

	if (watchlists.length > Config.DEFAULT_PAGE_SIZE) {
		return {
			watchlists: watchlists.slice(0, Config.DEFAULT_PAGE_SIZE),
			cursor: watchlists[Config.DEFAULT_PAGE_SIZE].id as string | undefined,
		};
	} else {
		return {
			watchlists,
			cursor: undefined as string | undefined,
		};
	}
};
