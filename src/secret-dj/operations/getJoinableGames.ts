import { db } from "../../db";
import { Season } from "@prisma/client";
import { SeasonState } from "../SeasonState";

type Environment = {
	participantId: string;
	cursor?: string;
	take: number;
};

/**
 * this is used for the browse page
 * @param participantId
 * @param cursor
 */
export const getJoinableGames = async ({
	participantId,
	cursor,
	take,
}: Environment): Promise<{ seasons: Pick<Season, "state" | "name">[]; cursor?: string }> => {
	const seasons = await db.season.findMany({
		where: {
			AND: [
				{
					state: SeasonState.SIGN_UP,
				},
				{
					entries: {
						none: {
							recipient: {
								id: participantId,
							},
						},
					},
				},
			],
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
