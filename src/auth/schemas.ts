import { z } from "zod";

export const authorizePayloadSchema = z.object({
	email: z.string(),
	token: z.string(),
});

export type AuthorizePayload = z.infer<typeof authorizePayloadSchema>;
