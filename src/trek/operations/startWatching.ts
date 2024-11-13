import { db } from "../../db";
import { ViewingState } from "../types";

export const startWatching = async ({ viewerId, watchlistId }: { viewerId: string; watchlistId: string }) => {
	const watchlist = await db.watchlist.findUniqueOrThrow({
		where: { id: watchlistId },
		include: {
			episodes: {
				take: 1,
				select: { id: true },
			},
		},
	});
	const [firstEpisode] = watchlist.episodes;
	await db.viewing.create({
		data: {
			watchlist: { connect: { id: watchlist.id } },
			viewer: { connect: { id: viewerId } },
			state: ViewingState.IN_PROGRESS,
			...(firstEpisode ? { episode: { connect: firstEpisode } } : {}),
			startedAt: { create: {} },
		},
	});
};
