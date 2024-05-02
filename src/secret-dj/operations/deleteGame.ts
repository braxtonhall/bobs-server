import { db } from "../../db";

type Environment = {
	seasonId: number;
	ownerId: number;
};

export const deleteGame = async ({ seasonId, ownerId }: Environment): Promise<void> => {
	const result = await db.season.delete({
		where: {
			id: seasonId,
			ownerId,
		},
	});

	if (!result) {
		throw new Error(`Unable to find season with id ${seasonId} for owner ${ownerId}`);
	}
};
