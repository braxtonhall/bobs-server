import { z } from "zod";
import Config from "../Config";

export const signupPayloadSchema = z.object({
	name: z.string().min(1).max(Config.DEFAULT_MAX_LENGTH),
});
