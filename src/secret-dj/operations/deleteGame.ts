import { db } from "../../db.js";

type Environment = {
	seasonId: string;
	ownerId: string;
};

export const deleteGame = async ({ seasonId, ownerId }: Environment): Promise<void> => {
	const result = await db.season.delete({
		where: {
			id: seasonId,
			ownerId,
			entries: {
				none: {},
			},
		},
	});

	if (!result) {
		throw new Error(`Unable to find season with id ${seasonId} for owner ${ownerId}`);
	}
};
