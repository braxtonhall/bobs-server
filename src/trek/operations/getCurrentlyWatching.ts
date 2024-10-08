import { db } from "../../db";

export type CurrentlyWatching = Awaited<ReturnType<typeof getCurrentlyWatching>>;

export const getCurrentlyWatching = async (viewerId: string) =>
	db.viewer.findUniqueOrThrow({
		where: {
			id: viewerId,
		},
		select: {
			watching: {
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
			current: {
				select: {
					id: true,
				},
			},
		},
	});
