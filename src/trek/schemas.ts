import { z } from "zod";
import Config from "../Config.js";

export const signupPayloadSchema = z.object({
	name: z.string().min(1).max(Config.DEFAULT_MAX_LENGTH),
});

export const updateSelfPayloadSchema = signupPayloadSchema.and(
	z.object({
		about: z.string().max(Config.DESCRIPTION_MAX_LENGTH),
	}),
);

export const episodeQuerySchema = z.object({ season: z.number(), show: z.string(), episode: z.number() });

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;

const hexSchema = z
	.string()
	.toLowerCase()
	.min(4)
	.max(9)
	.regex(/^#[0-9a-f]+$/);

export const settingsPayloadSchema = z.object({
	gravatar: z.boolean(),
	colours: z.record(z.string(), hexSchema).transform((colours) => JSON.stringify(colours)),
	isSpoilerEpisodeReviewComment: z.boolean(),
	isSpoilerEpisodeReviewScore: z.boolean(),
	isSpoilerEpisodeDescription: z.boolean(),
	isSpoilerEpisodePicture: z.boolean(),
	isSpoilerEpisodeName: z.boolean(),
	isSpoilerEpisodeReviewCommentSpoilerTag: z.boolean(),
	isSpoilerEpisodeRating: z.boolean(),
});
