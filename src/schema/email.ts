import { z } from "zod";

export const emailSchema = z
	.string()
	.transform((email) => email.trim())
	.refine((email) => /^\S+@\S+\.\S+$/.test(email), {
		message: "Email should resemble an email address",
	});
