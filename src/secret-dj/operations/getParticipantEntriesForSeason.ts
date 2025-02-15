import { db } from "../../db.js";

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
			dj: {
				select: {
					id: true,
					name: true,
				},
			},
			submissionUrl: true,
			rules: true,
			boxId: true,
		},
	});
	const futureDj = db.entry.findFirst({
		where: {
			seasonId,
			djId: userId,
		},
		select: {
			id: true,
			recipient: {
				select: {
					id: true,
					name: true,
				},
			},
			submissionUrl: true,
			rules: true,
			boxId: true,
		},
	});
	const [recipient, dj] = await Promise.all([futureRecipient, futureDj]);

	return { recipient, dj };
};
