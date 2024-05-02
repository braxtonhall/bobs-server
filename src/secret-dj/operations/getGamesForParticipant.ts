import { db } from "../../db";

type Environment = {
	participantId: number;
};

export const getGamesForParticipant = async ({ participantId }: Environment) => {
	const entries = await db.participant.findFirst({
		where: {
			id: participantId,
		},
		select: {
			recipientEntries: {
				select: {
					id: true,
					seasonId: true,
					submissionUrl: true, // TODO we don't want this if the game is IN_PROGRESS
					rules: {
						select: {
							text: true,
						},
					},
				},
			},
			djEntries: {
				select: {
					id: true,
					seasonId: true,
					submissionUrl: true,
					rules: {
						select: {
							text: true,
						},
					},
				},
			},
			ownedSeasons: {
				select: {
					id: true,
					name: true,
					state: true,
					ruleCount: true,
				},
			},
		},
	});

	if (!entries) {
		throw new Error("Participant does not exist");
	}

	return entries;
};
