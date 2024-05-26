import { db } from "../../db";
import { getSeasonsForParticipant } from "./getSeasonsForParticipant";

type Environment = {
	seasonId: string;
	participantId: string;
};

export const isParticipantRegisteredInGame = async ({ seasonId, participantId }: Environment) => {
	const seasons = await db.season.findMany({
		where: {
			entries: {
				some: {
					recipient: {
						id: participantId,
					},
				},
			},
		},
		select: {
			id: true,
		},
	});
	const seasonIds = seasons.map((season) => season.id);
	return seasonIds.includes(seasonId);
};
