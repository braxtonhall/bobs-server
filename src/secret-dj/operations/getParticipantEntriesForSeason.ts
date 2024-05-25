import { db } from "../../db";

type Environment = {
	seasonId: string;
	userId: number;
};

export const getParticipantEntriesForSeason = async ({ seasonId, userId }: Environment) => {
	const futureRecipient = db.entry.findFirst({
		where: {
			seasonId,
			recipientId: userId,
		},
	});
	const futureDj = db.entry.findFirst({
		where: {
			seasonId,
			djId: userId,
		},
	});
	const [recipient, dj] = await Promise.all([futureRecipient, futureDj]);

	return { recipient, dj };
};
