import { db, transaction } from "../../db";

type Environment = {
	emailId: string;
	name: string;
};

export const setViewing = async ({ emailId, name }: Environment) =>
	transaction(async () => {
		const existing = await db.viewer.findUnique({ where: { emailId } });
		if (existing) {
			await db.viewer.update({
				where: { emailId },
				data: { name },
			});
			return existing.id;
		} else {
			const viewer = await db.viewer.create({
				data: {
					email: {
						connect: {
							id: emailId,
						},
					},
					name,
					settings: "{}",
				},
			});
			const episodeIds = await db.episode.findMany({
				select: {
					id: true,
				},
				orderBy: {
					sort: "asc",
				},
			});
			const watchlist = await db.watchlist.create({
				data: {
					ownerId: viewer.id,
					name: `${name}'s trek`,
					description: "Where some have gone before",
					filters: "{}",
					episodes: {
						connect: episodeIds,
					},
				},
			});
			await db.viewing.create({
				data: {
					watchlist: { connect: watchlist },
					viewer: { connect: viewer },
					...(episodeIds.length ? { episode: { connect: { id: episodeIds[0].id } } } : {}),
				},
			});
			return viewer.id;
		}
	});
