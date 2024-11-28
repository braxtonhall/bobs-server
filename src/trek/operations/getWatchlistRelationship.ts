import { db, transaction } from "../../db";
import { ViewingState } from "../types";

export const getWatchlistRelationship = ({ watchlistId, viewerId }: { watchlistId: string; viewerId: string }) =>
	transaction(async () => {
		const [watchlist, inFlight] = await Promise.all([
			db.watchlist.findUniqueOrThrow({
				where: {
					id: watchlistId,
				},
				select: {
					_count: {
						select: {
							likes: {
								where: {
									viewerId,
								},
							},
							viewings: {
								where: {
									viewerId,
									state: ViewingState.FINISHED,
								},
							},
						},
					},
				},
			}),
			db.viewing.count({
				where: {
					viewerId,
					watchlistId,
					state: { notIn: [ViewingState.FINISHED] },
				},
			}),
		]);
		return {
			...watchlist,
			_count: {
				...watchlist._count,
				inFlight,
			},
		};
	});
