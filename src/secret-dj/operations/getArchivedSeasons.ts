import { db } from "../../db";
import { Season } from "@prisma/client";
import Config from "../../Config";
import { SeasonState } from "../SeasonState";

type Environment = {
	cursor?: number;
};

// TODO we might want to split this into ended/not ended
/**
 * this is used for the main landing page of secret-dj
 * @param participantId
 * @param cursor
 */
export const getArchivedSeasons = async ({
	cursor,
}: Environment): Promise<{ seasons: Pick<Season, "state" | "id" | "name">[]; cursor?: number }> => {
	const seasons = await db.season.findMany({
		where: {
			state: SeasonState.ENDED,
		},
		select: {
			state: true,
			id: true,
			name: true,
		},
		...(cursor !== undefined && { cursor: { id: cursor } }),
		orderBy: {
			id: "desc",
		},
		take: Config.DEFAULT_PAGE_SIZE + 1,
	});
	return { cursor: seasons[Config.DEFAULT_PAGE_SIZE]?.id, seasons: seasons.slice(0, Config.DEFAULT_PAGE_SIZE) };
};
