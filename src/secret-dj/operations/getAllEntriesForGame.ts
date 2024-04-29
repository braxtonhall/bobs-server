import { db } from "../../db";

export const getAllEntriesForGame = async (seasonId: number) => {
	const entries = await db.entry.findMany({
		where: {
			seasonId,
		},
	});

	if (!entries) {
		throw new Error("bad");
	}

	return entries;
};
