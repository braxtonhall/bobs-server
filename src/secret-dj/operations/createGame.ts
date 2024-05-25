import { db } from "../../db";

type Environment = {
	name: string;
	ruleCount: number;
	ownerId: number;
	description: string;
};

export const createGame = async ({
	name,
	description,
	ruleCount,
	ownerId,
}: Environment): Promise<{ id: number; userId: string }> => {
	if (ruleCount < 1) {
		throw new Error("Rule count must be equal to or greater than 1");
	}
	const result = await db.season.create({
		data: {
			name,
			ruleCount,
			ownerId,
			description,
		},
		select: {
			id: true,
			userId: true,
		},
	});

	if (result) {
		return result;
	} else {
		throw new Error("Could not create");
	}
};
