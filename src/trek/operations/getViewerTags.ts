import { db } from "../../db";

export const getViewerTags = async (viewerId: string) => {
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
