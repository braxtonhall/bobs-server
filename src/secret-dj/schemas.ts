import { z } from "zod";
import Config from "../Config";
import { checkboxSchema } from "../schema";
import { DateTime } from "luxon";

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
	unlisted: checkboxSchema,
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

const deadlineSchema = z.string().transform((string, ctx) => {
	if (string === "") {
		return null;
	}
	const date = DateTime.fromISO(string);
	if (date.isValid) {
		return date.toJSDate();
	} else {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Deadline should be a date",
		});
		return z.NEVER;
	}
});

export const deadlinesSchema = z.object({
	softDeadline: deadlineSchema,
	hardDeadline: deadlineSchema,
});

export type Deadlines = z.infer<typeof deadlinesSchema>;
