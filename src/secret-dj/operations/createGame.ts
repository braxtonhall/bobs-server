import { db } from "../../db";

export const createGame = async (name: string, ruleCount: number, ownerId: number): Promise<number> => {
	if (ruleCount < 1) {
		throw new Error("Rule count must be equal to or greater than 1");
	}
	const result = await db.season.create({
		data: {
			name,
			ruleCount,
			ownerId,
		},
		select: {
			id: true,
		},
	});

	return result?.id ?? null;
};
