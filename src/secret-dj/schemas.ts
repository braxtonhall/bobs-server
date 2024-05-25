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
