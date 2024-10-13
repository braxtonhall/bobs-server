import { db } from "../../db";

const PAGE_SIZE = 10;

export const getCurrentlyWatching = async (viewerId: string, cursor: string | undefined) => {
	const viewings = await db.viewing.findMany({
		where: {
			viewerId,
		},
		cursor: cursor ? { id: cursor } : undefined,
		take: PAGE_SIZE + 1,
		orderBy: {
			startedAt: "desc",
		},
		select: {
			id: true,
			cursor: true,
			watchlist: {
				include: {
					episodes: {
						include: {
							opinions: {
								where: {
									viewerId,
								},
							},
							_count: {
								select: {
									views: {
										where: {
											viewerId,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});
	if (viewings.length > PAGE_SIZE) {
		return {
			viewings: viewings.slice(0, -1),
			cursor: viewings[viewings.length - 1].id as string | undefined,
		};
	} else {
		return {
			viewings,
			cursor: undefined as string | undefined,
		};
	}
};
