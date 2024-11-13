import { db, transaction } from "../../db";

const RECENTLY_LIMIT = 10;

export const getViewer = ({ requestorId, targetId }: { requestorId?: string; targetId: string }) =>
	transaction(async () => {
		const futureBaseViewer = db.viewer.findUniqueOrThrow({
			where: {
				id: targetId,
			},
			include: {
				...(requestorId
					? {
							followers: {
								where: {
									followerId: requestorId,
								},
							},
							following: {
								where: {
									followedId: requestorId,
								},
							},
						}
					: {}),
				views: {
					include: { episode: true },
					orderBy: {
						createdAtId: "desc",
					},
					take: RECENTLY_LIMIT,
				},
				_count: {
					select: {
						followers: {},
						following: {},
						views: {},
						opinions: {},
						watchlistLikes: {},
						viewLikes: {},
						watchlists: {},
					},
				},
			},
		});
		const futureAdditionalCounts = db.viewer.findUniqueOrThrow({
			where: { id: targetId },
			select: {
				_count: {
					select: {
						views: {
							where: {
								comment: { notIn: null },
							},
						},
						opinions: {
							where: {
								liked: true,
							},
						},
					},
				},
			},
		});
		const futureTagsCount = db.tag.count({
			where: {
				OR: [
					{
						views: {
							some: {
								viewerId: targetId,
							},
						},
					},
					{
						watchlists: {
							some: {
								ownerId: targetId,
							},
						},
					},
				],
			},
		});
		const [baseViewer, additionalCounts, tagsCount] = await Promise.all([
			futureBaseViewer,
			futureAdditionalCounts,
			futureTagsCount,
		]);
		return {
			...baseViewer,
			_count: {
				...baseViewer._count,
				reviews: additionalCounts._count.views,
				episodeLikes: additionalCounts._count.opinions,
				tags: tagsCount,
			},
		};
	})
		.then((viewer) => ({ viewer, self: requestorId === targetId }))
		.catch(() => null);
