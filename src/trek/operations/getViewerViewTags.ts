import { db } from "../../db.js";

export const getViewerViewTags = async (viewerId: string) => {
	// TODO this should be... paginated?
	const tags = await db.tag.findMany({
		where: {
			views: {
				some: {
					viewerId,
				},
			},
		},
	});
	return tags.map(({ name }) => name);
};
