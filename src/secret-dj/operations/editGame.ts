import { db } from "../../db";

type Environment = {
	name: string;
	seasonId: string;
	ownerId: string;
	description: string;
};

export const editGame = async ({ name, description, seasonId, ownerId }: Environment): Promise<string> => {
	const result = await db.season.update({
		where: {
			id: seasonId,
		},
		data: {
			name,
			ownerId,
			description,
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
