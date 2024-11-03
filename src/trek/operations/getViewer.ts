import { db } from "../../db";

export const getViewer = ({ requestorId, targetId }: { requestorId: string; targetId: string }) =>
	db.viewer
		.findFirstOrThrow({
			where: {
				id: targetId,
			},
		})
		.then((viewer) => ({ viewer, self: requestorId === targetId }))
		.catch(() => null);
