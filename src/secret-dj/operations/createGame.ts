import { db, transaction } from "../../db";
import Config from "../../Config";

type Environment = {
	name: string;
	ruleCount: number;
	ownerId: string;
	description: string;
	emailId: string;
	unlisted: boolean;
};

export const createGame = async ({
	name,
	description,
	ruleCount,
	ownerId,
	emailId,
	unlisted,
}: Environment): Promise<string> =>
	transaction(async () => {
		if (ruleCount < 0) {
			throw new Error("Rule count must be equal to or greater than 0");
		}

		// https://github.com/prisma/prisma/issues/7093 this is *really* annoying
		const box = await db.box.create({
			data: {
				name: `secret dj/${name}`,
				ownerId: emailId,
				stylesheet: `https://${Config.HOST}/public/secret-dj/styles.css`,
			},
			select: {
				id: true,
			},
		});

		await db.subscription.create({
			data: { boxId: box.id, emailId },
		});

		const result = await db.season.create({
			data: {
				name,
				ruleCount,
				ownerId,
				description,
				boxId: box.id,
				unlisted,
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
