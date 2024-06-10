import { db, transaction } from "../../db";
import { HashedString } from "../../types/hashed";

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
	transaction(async () => {
		const deadCount = await db.post.count({
			where: {
				posterId: id,
				dead: true,
			},
		});
		await db.poster.update({
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
