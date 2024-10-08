import { db } from "../../db";
import { Series } from "@prisma/client";

export type SeriesCollection = Record<string, Series>;

export const getSeries = async (): Promise<SeriesCollection> => {
	const series = await db.series.findMany();
	return Object.fromEntries(series.map((series) => [series.id, series]));
};
