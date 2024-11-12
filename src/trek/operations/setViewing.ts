import { db, transaction } from "../../db";
import { ViewingState } from "../types";

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
			// TODO maybe you don't default to watching anything
			const viewer = await db.viewer.create({
				data: {
					email: {
						connect: {
							id: emailId,
						},
					},
					name,
					settings: "{}",
					createdAt: { create: {} },
				},
			});
			const watchlist = await db.watchlist.findFirst({
				where: {
					ownerId: { in: null },
				},
				include: {
					episodes: {
						take: 1,
						select: { id: true },
					},
				},
			});
			if (watchlist) {
				const [firstEpisode] = watchlist.episodes;
				await db.viewing.create({
					data: {
						watchlist: { connect: { id: watchlist.id } },
						viewer: { connect: viewer },
						state: ViewingState.IN_PROGRESS,
						...(firstEpisode ? { episode: { connect: firstEpisode } } : {}),
						startedAt: { create: {} },
					},
				});
			}
			return viewer.id;
		}
	});
