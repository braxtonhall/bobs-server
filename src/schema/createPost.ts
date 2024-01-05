import { z } from "zod";
import { emailSchema } from "./email";

export const createPostSchema = z.object({
	from: z.string(),
	email: emailSchema.optional(),
	content: z.string(),
	parent: z.string().optional(),
});

export type CreatePost = z.infer<typeof createPostSchema>;
