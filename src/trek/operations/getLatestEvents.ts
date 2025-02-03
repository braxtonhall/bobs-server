import { db } from "../../db.js";
import { Scope } from "../types.js";
import Config from "../../Config.js";
import { Prisma } from "@prisma/client";

const hasFollower = (viewerId: string) => ({ followers: { some: { followerId: viewerId } } }) as const;

const where = (viewerId: string | undefined, scope: Scope): Prisma.EventWhereInput => {
	// TODO this is stupid. there should just be different functions
	switch (scope) {
		case Scope.FOLLOWING: {
			if (!viewerId) {
				throw new Error("Viewer ID is required");
			}
			return {
				OR: [
					{ view: { viewer: hasFollower(viewerId) } },
					{ watchlist: { owner: hasFollower(viewerId) } },
					{ startedViewing: { viewer: hasFollower(viewerId) } },
					{ finishedViewing: { viewer: hasFollower(viewerId) } },
					{ viewLike: { viewer: hasFollower(viewerId) } },
					{ watchlistLike: { viewer: hasFollower(viewerId) } },
					{ follow: { follower: hasFollower(viewerId) } },
					{ viewer: hasFollower(viewerId) },
				],
			};
		}
		case Scope.EVERYONE:
			return {};
		case Scope.INDIVIDUAL: {
			if (!viewerId) {
				throw new Error("Viewer ID is required");
			}
			return {
				OR: [
					{ view: { viewerId } },
					{ watchlist: { ownerId: viewerId } },
					{ startedViewing: { viewerId } },
					{ finishedViewing: { viewerId } },
					{ viewLike: { viewerId } },
					{ watchlistLike: { viewerId } },
					{ follow: { followerId: viewerId } },
					{ viewer: { id: viewerId } },
				],
			};
		}
		default:
			return scope satisfies never;
	}
};

// TODO use the scope!!!
export const getLatestEvents = async ({
	cursor,
	viewerId,
	scope,
}: {
	cursor?: number;
	viewerId?: string;
	scope: Scope;
}) => {
	const events = await db.event.findMany({
		cursor: cursor ? { id: cursor } : undefined,
		orderBy: { id: "desc" },
		take: Config.DEFAULT_PAGE_SIZE + 1,
		select: {
			id: true,
			time: true,
			view: {
				select: {
					episodeId: true,
					id: true,
					viewedOn: true,
					viewer: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
				},
			},
			watchlist: {
				include: {
					owner: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
				},
			},
			startedViewing: {
				include: {
					viewer: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
					watchlist: true,
				},
			},
			finishedViewing: {
				include: {
					viewer: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
					watchlist: true,
				},
			},
			viewLike: {
				select: {
					viewer: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
					view: {
						select: {
							episodeId: true,
							id: true,
							viewedOn: true,
							viewer: {
								include: {
									email: {
										select: {
											gravatar: true,
										},
									},
								},
							},
						},
					},
				},
			},
			watchlistLike: {
				select: {
					viewer: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
					watchlist: true,
				},
			},
			follow: {
				select: {
					follower: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
					followed: {
						include: {
							email: {
								select: {
									gravatar: true,
								},
							},
						},
					},
				},
			},
			viewer: {
				include: {
					email: {
						select: {
							gravatar: true,
						},
					},
				},
			},
		},
		where: where(viewerId, scope),
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
