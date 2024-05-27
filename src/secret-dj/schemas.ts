import { z } from "zod";

export const signupPayloadSchema = z.object({
	name: z.string().min(1),
});
export type SignupPayload = z.infer<typeof signupPayloadSchema>;

export const settingsPayloadSchema = signupPayloadSchema;
export type SettingsPayload = SignupPayload;

export const createSeasonPayloadSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	rules: z.coerce.number().min(1),
});
export type CreateSeasonPayload = z.infer<typeof createSeasonPayloadSchema>;

export const editSeasonPayloadSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
});
export type EditSeasonPayload = z.infer<typeof editSeasonPayloadSchema>;

export const submitPlaylistPayloadSchema = z.object({ link: z.string().min(1) });
export type SubmitPlaylistPayload = z.infer<typeof submitPlaylistPayloadSchema>;

export const submitRulesSchema = z.object({
	recipientId: z.string().min(1),
	rules: z.array(z.string()).min(1),
});
export type SubmitRulesSchema = z.infer<typeof submitRulesSchema>;
