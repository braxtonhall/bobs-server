import { z } from "zod";
import { emailSchema } from "./email";
import { Option, None, Some } from "../types/option";

export const createPostSchema = z.object({
	from: z.string(),
	email: emailSchema.optional().transform((email): Option<string> => {
		if (email) {
			return Some(email);
		} else {
			return None();
		}
	}),
	content: z.string(),
	parent: z.string().optional(),
});

export type CreatePost = z.infer<typeof createPostSchema>;
