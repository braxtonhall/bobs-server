import { z } from "zod";

export const signupPayloadSchema = z.object({
	name: z.string(),
});

export type SignupPayload = z.infer<typeof signupPayloadSchema>;
