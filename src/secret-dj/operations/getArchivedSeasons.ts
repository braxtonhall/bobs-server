import { db } from "../../db";
import { Season } from "@prisma/client";
import Config from "../../Config";
import { SeasonState } from "../SeasonState";

type Environment = {
	cursor?: string;
};

/**
 * this is used for the archive page
 * @param participantId
 * @param cursor
 */
export const getArchivedSeasons = async ({
	cursor,
}: Environment): Promise<{ seasons: Pick<Season, "state" | "name">[]; cursor?: string }> => {
	const seasons = await db.season.findMany({
		where: {
			state: SeasonState.ENDED,
		},
		select: {
			state: true,
			userId: true,
			name: true,
		},
		...(cursor !== undefined && { cursor: { userId: cursor } }),
		orderBy: {
			id: "desc",
		},
		take: Config.DEFAULT_PAGE_SIZE + 1,
	});
	return { cursor: seasons[Config.DEFAULT_PAGE_SIZE]?.userId, seasons: seasons.slice(0, Config.DEFAULT_PAGE_SIZE) };
};
