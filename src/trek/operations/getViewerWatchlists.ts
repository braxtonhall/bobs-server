import { db } from "../../db.js";

const PAGE_SIZE = 100;

export const getViewerWatchlists = ({ viewerId, cursor }: { viewerId: string; cursor?: string }) =>
	db.viewer
		.findUniqueOrThrow({
			where: { id: viewerId },
			include: {
				watchlists: {
					orderBy: {
						createdAtId: "desc",
					},
					take: PAGE_SIZE + 1,
					cursor: cursor ? { id: cursor } : undefined,
				},
			},
		})
		.then(({ watchlists }) => ({
			watchlists: watchlists.slice(0, PAGE_SIZE),
			cursor: watchlists[PAGE_SIZE]?.id,
		}));
