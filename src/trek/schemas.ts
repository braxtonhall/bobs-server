import { z } from "zod";
import Config from "../Config";

export const signupPayloadSchema = z.object({
	name: z.string().min(1).max(Config.DEFAULT_MAX_LENGTH),
});

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;

export const settingsPayloadSchema = z.object({
	colours: z.record(z.string(), z.string()).transform((colours) => JSON.stringify(colours)),
	isSpoilerEpisodeReviewComment: z.boolean(),
	isSpoilerEpisodeReviewScore: z.boolean(),
	isSpoilerEpisodeDescription: z.boolean(),
	isSpoilerEpisodePicture: z.boolean(),
	isSpoilerEpisodeName: z.boolean(),
	isSpoilerEpisodeReviewCommentSpoilerTag: z.boolean(),
	isSpoilerEpisodeRating: z.boolean(),
});
