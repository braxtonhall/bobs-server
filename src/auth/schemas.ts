import { z } from "zod";

export const loginPayloadSchema = z.object({
	email: z.string(),
});
export type LoginPayload = z.infer<typeof authorizePayloadSchema>;

export const authorizePayloadSchema = z.object({
	email: z.string(),
	token: z.string(),
});

export type AuthorizePayload = z.infer<typeof authorizePayloadSchema>;
