import { db } from "../../db.js";

type Environment = { seasonId: string; entryId: string };

export const getEntry = async ({ seasonId, entryId }: Environment) => {
	const entry = await db.entry.findUnique({
		where: {
			seasonId,
			id: entryId,
		},
		include: {
			season: true,
			dj: true,
			recipient: true,
			rules: true,
			box: { select: { id: true } },
		},
	});

	if (!entry) {
		throw new Error("Could not find entry");
	}

	return entry;
};
