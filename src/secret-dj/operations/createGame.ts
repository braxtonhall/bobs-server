import { db } from "../../db";
import Config from "../../Config";

type Environment = {
	name: string;
	ruleCount: number;
	ownerId: string;
	description: string;
	emailId: string;
};

export const createGame = async ({ name, description, ruleCount, ownerId, emailId }: Environment): Promise<string> =>
	db.$transaction(async (tx) => {
		if (ruleCount < 1) {
			throw new Error("Rule count must be equal to or greater than 1");
		}

		// https://github.com/prisma/prisma/issues/7093 this is *really* annoying
		const box = await tx.box.create({
			data: {
				name: "comments",
				ownerId: emailId,
				stylesheet: `https://${Config.HOST}/public/secret-dj/styles.css`,
			},
			select: {
				id: true,
			},
		});

		const result = await tx.season.create({
			data: {
				name,
				ruleCount,
				ownerId,
				description,
				boxId: box.id,
			},
			select: {
				id: true,
			},
		});

		if (result) {
			return result.id;
		} else {
			throw new Error("Could not create");
		}
	});
