import { db } from "../../db";
import { Viewer } from "@prisma/client";

export type Content = Awaited<ReturnType<typeof getContent>>;

export const getContent = async (viewer: Viewer) => {
	const series = await db.series.findMany();
	const episodes = await db.episode.findMany({
		include: {
			views: {
				where: {
					viewer,
				},
			},
		},
	});
	return { episodes, series: Object.fromEntries(series.map((series) => [series.id, series])) };
};
