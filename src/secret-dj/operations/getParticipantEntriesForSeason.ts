import { db } from "../../db";

type Environment = {
	seasonId: string;
	userId: string;
};

export const getParticipantEntriesForSeason = async ({ seasonId, userId }: Environment) => {
	const futureRecipient = db.entry.findFirst({
		where: {
			seasonId,
			recipientId: userId,
		},
		select: {
			id: true,
			djId: true,
			submissionUrl: true,
			rules: true,
		},
	});
	const futureDj = db.entry.findFirst({
		where: {
			seasonId,
			djId: userId,
		},
		select: {
			id: true,
			recipientId: true,
			submissionUrl: true,
			rules: true,
		},
	});
	const [recipient, dj] = await Promise.all([futureRecipient, futureDj]);

	return { recipient, dj };
};
