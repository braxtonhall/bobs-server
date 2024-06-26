import { z } from "zod";
import { emailSchema } from "../toolbox/schema/email";
import Config from "../Config";

export const loginPayloadSchema = z.object({
	email: emailSchema,
});
export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const authorizePayloadSchema = z.object({
	email: emailSchema,
	token: z.string().trim().max(Config.DEFAULT_MAX_LENGTH),
});

export type AuthorizePayload = z.infer<typeof authorizePayloadSchema>;
