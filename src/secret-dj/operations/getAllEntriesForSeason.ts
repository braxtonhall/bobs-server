import { Entry } from "@prisma/client";
import { db } from "../../db";

type Environment = {
	seasonId: number;
};

export const getAllEntriesForSeason = async ({ seasonId }: Environment): Promise<Entry[]> => {
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
