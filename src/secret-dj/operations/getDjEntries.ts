import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	participantId: string;
	entryCursor?: string;
	entryTake: number;
	seasonTake: number;
	seasonCursor?: string;
	submissionCursor?: string;
	submissionTake: number;
};

export const getDjEntries = async ({
	participantId,
	entryCursor,
	entryTake,
	seasonTake,
	seasonCursor,
	submissionTake,
	submissionCursor,
}: Environment) => {
	const result = await db.participant.findUnique({
		where: {
			id: participantId,
		},
		select: {
			name: true,
			ownedSeasons: {
				where: {
					state: SeasonState.ENDED,
				},
				select: {
					name: true,
					description: true,
					id: true,
				},
				take: seasonTake + 1,
				cursor: seasonCursor ? { id: seasonCursor } : undefined,
				orderBy: { sort: "desc" },
			},
			recipientEntries: {
				where: {
					season: {
						state: SeasonState.ENDED,
						ruleCount: { gt: 0 },
					},
				},
				select: {
					id: true,
					rules: true,
					season: {
						select: {
							name: true,
							id: true,
						},
					},
				},
				take: entryTake + 1,
				cursor: entryCursor ? { id: entryCursor } : undefined,
				orderBy: { sort: "desc" },
			},
			djEntries: {
				where: {
					season: {
						state: SeasonState.ENDED,
					},
				},
				select: {
					id: true,
					recipient: {
						select: {
							id: true,
							name: true,
						},
					},
					season: {
						select: {
							name: true,
							id: true,
						},
					},
				},
				take: submissionTake + 1,
				cursor: submissionCursor ? { id: submissionCursor } : undefined,
				orderBy: { sort: "desc" },
			},
		},
	});
	if (result) {
		return {
			name: result.name,
			entries: result.recipientEntries.slice(0, entryTake),
			entryCursor: result.recipientEntries[entryTake]?.id,
			submissions: result.djEntries.slice(0, submissionTake),
			submissionCursor: result.djEntries[submissionTake]?.id,
			seasons: result.ownedSeasons.slice(0, seasonTake),
			seasonCursor: result.ownedSeasons[seasonTake]?.id,
		};
	} else {
		throw new Error("DJ does not exist");
	}
};
