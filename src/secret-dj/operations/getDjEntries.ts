import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	participantId: string;
	entryCursor?: string;
	entryTake: number;
	seasonTake: number;
	seasonCursor?: string;
};

export const getDjEntries = async ({
	participantId,
	entryCursor,
	entryTake,
	seasonTake,
	seasonCursor,
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
				take: entryTake + 1,
				cursor: entryCursor ? { id: entryCursor } : undefined,
				orderBy: { sort: "desc" },
			},
		},
	});
	if (result) {
		return {
			name: result.name,
			entries: result.djEntries.slice(0, entryTake),
			entryCursor: result.djEntries[entryTake]?.id,
			seasons: result.ownedSeasons.slice(0, seasonTake),
			seasonCursor: result.ownedSeasons[seasonTake]?.id,
		};
	} else {
		throw new Error("DJ does not exist");
	}
};
