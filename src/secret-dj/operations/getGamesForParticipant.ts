import { db } from "../../db";

export const getGamesForParticipant = async (participantId: number) => {
	const entries = await db.participant.findFirst({
		where: {
			id: participantId,
		},
		select: {
			recipientEntries: true,
			djEntries: true,
		},
	});

	if (!entries) {
		throw new Error("bad");
	}

	return entries;
};
