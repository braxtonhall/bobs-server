import { z } from "zod";
import { originSchema } from "./origin.js";
import { stylesheetSchema } from "./stylesheet.js";
import Config from "../../Config.js";

export const createBoxSchema = z.object({
	stylesheet: stylesheetSchema.optional(),
	origin: originSchema.optional(),
	name: z.string().max(Config.DEFAULT_MAX_LENGTH),
});

export type CreateBox = z.infer<typeof createBoxSchema>;
