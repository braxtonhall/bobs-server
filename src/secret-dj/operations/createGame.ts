import { db } from "../../db";

export const createGame = async (name: string, ruleCount: number): Promise<number> => {
	const result = await db.season.create({
		data: {
			name,
			ruleCount,
		},
		select: {
			id: true,
		},
	});

	return result?.id ?? null;
};
