import { DateTime } from "luxon";
import { z } from "zod";
import { db, transaction } from "../../db";
import { updateCursor } from "./updateCursor";

export const logEpisodeSchema = z.object({
	viewedOn: z.null().or(z.number().transform((number) => DateTime.fromMillis(number))),
	tags: z.array(z.string()),
	liked: z.boolean(),
	rating: z.null().or(
		z
			.number()
			.min(0)
			.max(5)
			.transform((number) => number || null),
	),
	episodeId: z.string(),
	comment: z.null().or(
		z
			.string()
			.trim()
			.transform((string) => string || null),
	),
});

export const logEpisode = async (viewerId: string, env: z.infer<typeof logEpisodeSchema>) =>
	transaction(async () => {
		await db.view.create({
			data: {
				viewerId,
				episodeId: env.episodeId,
				liked: env.liked,
				rating: env.rating,
				comment: env.comment,
				viewedOn: env.viewedOn?.toJSDate(),
				tags: {
					connectOrCreate: env.tags.map((name) => ({
						where: { name },
						create: { name },
					})),
				},
			},
		});
		const opinion = {
			viewerId,
			episodeId: env.episodeId,
			liked: env.liked,
			...(env.rating ? { rating: env.rating } : {}),
		};
		await db.opinion.upsert({
			where: {
				viewerId_episodeId: {
					viewerId,
					episodeId: env.episodeId,
				},
			},
			create: opinion,
			update: opinion,
		});
		const viewer = await db.viewer.findUniqueOrThrow({
			where: { id: viewerId },
			include: {
				watching: {
					include: {
						episodes: {
							cursor: { id: env.episodeId },
							take: 1,
							skip: 1,
						},
					},
				},
			},
		});
		if (viewer.currentId === env.episodeId) {
			await updateCursor({ viewerId, episodeId: viewer.watching?.episodes[0].id ?? null });
		}
	});
