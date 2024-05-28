import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = { participantId: string; cursor?: string; take: number };

export const getDjEntries = async ({ participantId, cursor, take }: Environment) => {
	const result = await db.participant.findUnique({
		where: {
			id: participantId,
		},
		select: {
			name: true,
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
				take: take + 1,
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: { sort: "desc" },
			},
		},
	});
	if (result) {
		return { name: result.name, entries: result.djEntries.slice(0, take), cursor: result.djEntries[take]?.id };
	} else {
		throw new Error("DJ does not exist");
	}
};
