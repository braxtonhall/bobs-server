import { db } from "../../db";
import { Season } from "@prisma/client";
import { SeasonState } from "../SeasonState";

type Environment = {
	cursor?: string;
	take: number;
};

/**
 * this is used for the archive page
 * @param cursor
 * @param take
 */
export const getArchivedSeasons = async ({
	cursor,
	take,
}: Environment): Promise<{ seasons: Pick<Season, "state" | "name">[]; cursor?: string }> => {
	const seasons = await db.season.findMany({
		where: {
			state: SeasonState.ENDED,
		},
		select: {
			owner: true,
			state: true,
			id: true,
			name: true,
			description: true,
		},
		...(cursor !== undefined && { cursor: { id: cursor } }),
		orderBy: {
			sort: "desc",
		},
		take: take + 1,
	});
	return { cursor: seasons[take]?.id, seasons: seasons.slice(0, take) };
};
