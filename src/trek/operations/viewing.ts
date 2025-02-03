import { db, transaction } from "../../db.js";
import { ViewingState } from "../types.js";

export const start = async ({ viewerId, watchlistId }: { viewerId: string; watchlistId: string }) => {
	const watchlist = await db.watchlist.findUniqueOrThrow({
		where: { id: watchlistId },
		include: {
			entries: {
				take: 1,
				select: { episodeId: true },
				orderBy: { rank: "asc" },
			},
		},
	});
	const [firstEpisode] = watchlist.entries;
	await db.viewing.create({
		data: {
			watchlist: { connect: { id: watchlist.id } },
			viewer: { connect: { id: viewerId } },
			state: ViewingState.IN_PROGRESS,
			...(firstEpisode ? { episode: { connect: { id: firstEpisode.episodeId } } } : {}),
			startedAt: { create: {} },
		},
	});
};

export const resume = ({ viewerId, viewingId }: { viewerId: string; viewingId: string }) =>
	db.viewing.update({
		where: {
			viewerId,
			id: viewingId,
			state: ViewingState.PAUSED,
		},
		data: {
			state: ViewingState.IN_PROGRESS,
		},
	});

export const pause = ({ viewerId, viewingId }: { viewerId: string; viewingId: string }) =>
	db.viewing.update({
		where: {
			viewerId,
			id: viewingId,
			state: ViewingState.IN_PROGRESS,
		},
		data: {
			state: ViewingState.PAUSED,
		},
	});

export const complete = ({ viewerId, viewingId }: { viewerId: string; viewingId: string }) =>
	db.viewing.update({
		where: {
			viewerId,
			id: viewingId,
			state: ViewingState.IN_PROGRESS,
		},
		data: {
			state: ViewingState.FINISHED,
			episode: { disconnect: true },
			finishedAt: { create: {} },
		},
	});

export const stop = ({ viewerId, viewingId }: { viewerId: string; viewingId: string }) =>
	transaction(async () => {
		const { startedAtId } = await db.viewing.delete({
			where: { viewerId, id: viewingId },
		});
		await db.event.delete({
			where: { id: startedAtId },
		});
	});
