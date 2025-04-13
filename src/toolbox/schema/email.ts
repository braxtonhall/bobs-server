import { z } from "zod";
import Config from "../../Config.js";

export const emailSchema = z
	.string()
	.trim()
	.max(Config.DEFAULT_MAX_LENGTH)
	.refine((email) => /^\S+@\S+\.\S+$/.test(email), {
		message: "Email should resemble an email address",
	});
