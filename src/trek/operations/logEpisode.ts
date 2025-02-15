import { z } from "zod";
import { db, transaction } from "../../db.js";
import { incrementCursor, updateCursor } from "./updateCursor.js";
import { DateTime } from "luxon";
import Config from "../../Config.js";

export type LogEpisodePayload = z.infer<typeof logEpisodeSchema>;

export const logEpisodeSchema = z.object({
	viewedOn: z.null().or(
		z
			.string()
			.regex(/\d\d\d\d-\d\d-\d\d/)
			.transform((arg, ctx) => {
				if (DateTime.fromFormat(arg, "yyyy-MM-dd").isValid) {
					return arg;
				} else {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "viewed on should be of format yyyy-MM-dd",
					});
					return z.NEVER;
				}
			}),
	),
	tags: z.array(z.string().max(Config.DEFAULT_MAX_LENGTH)),
	liked: z.boolean(),
	rating: z.null().or(
		z
			.number()
			.min(0)
			.max(10)
			.transform((number) => number || null),
	),
	episodeId: z.string(),
	comment: z.null().or(
		z
			.string()
			.trim()
			.max(Config.COMMENT_MAX_LENGTH)
			.transform((string) => string || null),
	),
	spoiler: z.boolean(),
});

export const logEpisode = async (viewerId: string, env: z.infer<typeof logEpisodeSchema>) =>
	transaction(async () => {
		await db.view.create({
			data: {
				viewer: { connect: { id: viewerId } },
				episode: { connect: { id: env.episodeId } },
				liked: env.liked,
				rating: env.rating,
				comment: env.comment,
				tags: {
					connectOrCreate: env.tags.map((name) => ({
						where: { name },
						create: { name },
					})),
				},
				viewedOn: env.viewedOn,
				spoiler: env.comment === null ? false : env.spoiler,
				createdAt: { create: {} },
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
			},
		});
		for (const viewing of viewings) {
			await incrementCursor({
				viewerId,
				viewingId: viewing.id,
			});
		}
	});
