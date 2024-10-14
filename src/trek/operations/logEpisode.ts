import { z } from "zod";
import { db, transaction } from "../../db";
import { updateCursor } from "./updateCursor";
import { DateTime } from "luxon";

export type LogEpisodePayload = z.infer<typeof logEpisodeSchema>;

export const logEpisodeSchema = z.object({
	viewedOn: z.null().or(z.number()),
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
	spoiler: z.boolean(),
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
				tags: {
					connectOrCreate: env.tags.map((name) => ({
						where: { name },
						create: { name },
					})),
				},
				// TODO should set the viewed on to utc, start of day
				viewedOn:
					env.viewedOn === null
						? null
						: DateTime.fromMillis(env.viewedOn).setZone("utc").startOf("day").toJSDate(),
				spoiler: env.comment === null ? false : env.spoiler,
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
		const viewings = await db.viewing.findMany({
			where: {
				viewerId,
				cursor: env.episodeId,
			},
			select: {
				id: true,
				watchlist: {
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
		for (const viewing of viewings) {
			await updateCursor({
				viewerId,
				episodeId: viewing.watchlist.episodes[0]?.id ?? null,
				viewingId: viewing.id,
			});
		}
	});