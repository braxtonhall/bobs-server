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
							views: {
								where: {
									viewerId,
								},
								orderBy: {
									createdAt: "desc",
								},
								take: 1,
							},
							opinions: {
								where: {
									viewerId,
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
