import { db } from "../../db";
import { Season } from "@prisma/client";
import { SeasonState } from "../SeasonState";

type Environment = {
	participantId: string;
	cursor?: string;
	take: number;
};

/**
 * this is used for the main landing page of secret-dj
 * @param participantId
 * @param cursor
 * @param take
 */
export const getSeasonsForParticipant = async ({
	participantId,
	cursor,
	take,
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
		take: take + 1,
	});
	return { cursor: seasons[take]?.id, seasons: seasons.slice(0, take) };
};
