import { db, transaction } from "../../db";
import Config from "../../Config";

export const getViewer = ({ requestorId, targetId }: { requestorId?: string; targetId: string }) =>
	transaction(async () => {
		const futureBaseViewer = db.viewer.findUniqueOrThrow({
			where: {
				id: targetId,
			},
			select: {
				name: true,
				about: true,
				id: true,
				gravatar: true,
				email: {
					select: {
						address: requestorId === targetId,
						gravatar: true,
					},
				},
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
					take: Config.TREK_PROFILE_RECENTLY_MAX,
				},
				favourites: { where: { rank: { lt: Config.TREK_FAVOURITES_MAX } } },
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
			email: {
				...baseViewer.email,
				gravatar: (baseViewer.gravatar && baseViewer.email?.gravatar) || null,
			},
			_count: {
				...baseViewer._count,
				reviews: additionalCounts._count.views,
				episodeLikes: additionalCounts._count.opinions,
				tags: tagsCount,
			},
			followingRequestor: !!baseViewer.following?.length,
			followedByRequestor: !!baseViewer.followers?.length,
		};
	})
		.then((viewer) => ({ viewer, self: requestorId === targetId }))
		.catch(() => null);
