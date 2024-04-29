import { db } from "../../db";

export const createGame = async (name: string, ruleCount: number, ownerId: number): Promise<number> => {
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
