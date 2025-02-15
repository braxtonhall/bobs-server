import { z } from "zod";
import { emailSchema } from "./email.js";
import { Option, None, Some } from "../../types/option.js";
import Config from "../../Config.js";

export const createPostSchema = z.object({
	from: z.string().trim().max(Config.DEFAULT_MAX_LENGTH),
	email: emailSchema
		.or(z.literal(""))
		.optional()
		.transform((email): Option<string> => {
			if (email) {
				return Some(email);
			} else {
				return None();
			}
		}),
	content: z.string().max(Config.COMMENT_MAX_LENGTH),
	parent: z.string().max(Config.DEFAULT_MAX_LENGTH).optional(),
});

export type CreatePost = z.infer<typeof createPostSchema>;
