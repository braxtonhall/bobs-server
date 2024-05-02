import { db } from "../../db";

type Environment = {
	name: string;
	ruleCount: number;
	ownerId: number;
};

export const createGame = async ({ name, ruleCount, ownerId }: Environment): Promise<number> => {
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
