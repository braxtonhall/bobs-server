import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	participantId: string;
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
					season: {
						select: {
							state: true,
						},
					},
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

	const filteredRecipientEntries = entries.recipientEntries.map((entry) => {
		if (entry.season.state !== SeasonState.ENDED) {
			return {
				...entry,
				// rm submission URL from response if game is in progress
				submissionUrl: null,
			};
		}

		return entry;
	});

	return {
		...entries,
		recipientEntries: filteredRecipientEntries,
	};
};
