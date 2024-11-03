import { db } from "../../db";

const RECENTLY_LIMIT = 10;

export const getViewer = ({ requestorId, targetId }: { requestorId: string; targetId: string }) =>
	db.viewer
		.findFirstOrThrow({
			where: {
				id: targetId,
			},
			include: {
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
					},
				},
			},
		})
		.then((viewer) => ({ viewer, self: requestorId === targetId }))
		.catch(() => null);
