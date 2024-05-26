import { db } from "../../db";
import { Season } from "@prisma/client";
import Config from "../../Config";
import { SeasonState } from "../SeasonState";

type Environment = {
	participantId: string;
	cursor?: string;
};

/**
 * this is used for the main landing page of secret-dj
 * @param participantId
 * @param cursor
 */
export const getSeasonsForParticipant = async ({
	participantId,
	cursor,
}: Environment): Promise<{ seasons: Pick<Season, "state" | "id" | "name" | "description">[]; cursor?: string }> => {
	const seasons = await db.season.findMany({
		where: {
			AND: [
				{
					OR: [
						{
							owner: {
								id: participantId,
							},
						},
						{
							entries: {
								some: {
									recipient: {
										id: participantId,
									},
								},
							},
						},
					],
				},
				{ state: { not: SeasonState.ENDED } },
			],
		},
		select: {
			owner: {
				select: {
					name: true,
					id: true,
				},
			},
			state: true,
			id: true,
			name: true,
			description: true,
		},
		...(cursor !== undefined && { cursor: { id: cursor } }),
		orderBy: {
			sort: "desc",
		},
		take: Config.DEFAULT_PAGE_SIZE + 1,
	});
	return { cursor: seasons[Config.DEFAULT_PAGE_SIZE]?.id, seasons: seasons.slice(0, Config.DEFAULT_PAGE_SIZE) };
};
