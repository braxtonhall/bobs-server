import { db } from "../../db.js";

type Environment = {
	name: string;
	seasonId: string;
	ownerId: string;
	description: string;
	unlisted: boolean;
};

export const editGame = async ({ name, description, seasonId, ownerId, unlisted }: Environment): Promise<string> => {
	const result = await db.season.update({
		where: {
			id: seasonId,
		},
		data: {
			name,
			ownerId,
			description,
			unlisted,
		},
		select: {
			id: true,
		},
	});

	if (result) {
		return result.id;
	} else {
		throw new Error("Could not edit");
	}
};
