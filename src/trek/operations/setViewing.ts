import { db, transaction } from "../../db";

type Environment = {
	emailId: string;
	name: string;
};

export const setViewing = async ({ emailId, name }: Environment) =>
	transaction(async () => {
		const viewer = await db.viewer.upsert({
			where: {
				emailId,
			},
			create: {
				email: {
					connect: {
						id: emailId,
					},
				},
				name,
			},
			update: {
				emailId,
				name,
			},
			include: {
				_count: {
					select: {
						watchlists: {},
					},
				},
			},
		});
		if (viewer._count.watchlists === 0) {
			const episodeIds = await db.episode.findMany({
				select: {
					id: true,
				},
				orderBy: {
					sort: "asc",
				},
			});
			await db.viewer.update({
				where: {
					id: viewer.id,
				},
				data: {
					...(episodeIds.length
						? {
								current: {
									connect: {
										id: episodeIds[0].id,
									},
								},
							}
						: {}),
					watching: {
						create: {
							name: `${name}'s trek`,
							description: "Where some have gone before",
							filters: "{}",
							ownerId: viewer.id,
							episodes: {
								connect: episodeIds,
							},
						},
					},
				},
			});
		}
		return viewer.id;
	});
