import { db } from "./db";
import { HashedString } from "../types/hashed";

const getId = async (ip: HashedString): Promise<number> =>
	db.poster
		.upsert({
			where: {
				ip,
			},
			update: {},
			create: {
				ip,
			},
			select: {
				id: true,
			},
		})
		.then(({ id }) => id);

const updateKarma = async (id: number): Promise<void> =>
	db.$transaction(async (tx) => {
		const deadCount = await tx.post.count({
			where: {
				posterId: id,
				dead: true,
			},
		});
		await tx.poster.update({
			where: {
				id,
			},
			data: {
				karma: deadCount,
			},
		});
	});

export default {
	getId,
	updateKarma,
};
