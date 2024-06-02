import { z } from "zod";
import Config from "../Config";

export const signupPayloadSchema = z.object({
	name: z.string().min(1).max(Config.DEFAULT_MAX_LENGTH),
});
export type SignupPayload = z.infer<typeof signupPayloadSchema>;

export const settingsPayloadSchema = signupPayloadSchema;
export type SettingsPayload = SignupPayload;

export const createSeasonPayloadSchema = z.object({
	name: z.string().min(1).max(Config.DEFAULT_MAX_LENGTH),
	description: z.string().max(Config.DESCRIPTION_MAX_LENGTH).default(""),
	rules: z.coerce.number().int().min(0),
});
export type CreateSeasonPayload = z.infer<typeof createSeasonPayloadSchema>;

export const editSeasonPayloadSchema = createSeasonPayloadSchema.omit({ rules: true });
export type EditSeasonPayload = z.infer<typeof editSeasonPayloadSchema>;

export const submitPlaylistPayloadSchema = z.object({
	link: z
		.string()
		.max(Config.DEFAULT_MAX_LENGTH)
		.transform((address, ctx): string => {
			try {
				return new URL(address).toString();
			} catch {
				// Do nothing :)
			}
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Link should be a website url",
			});
			return z.NEVER;
		}),
});
export type SubmitPlaylistPayload = z.infer<typeof submitPlaylistPayloadSchema>;

export const submitRulesSchema = z.object({
	rules: z.array(z.string().min(1).max(Config.DESCRIPTION_MAX_LENGTH)).default([]),
});
export type SubmitRulesSchema = z.infer<typeof submitRulesSchema>;
