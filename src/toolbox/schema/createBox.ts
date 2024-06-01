import { z } from "zod";
import { originSchema } from "./origin";
import { stylesheetSchema } from "./stylesheet";
import Config from "../../Config";

export const createBoxSchema = z.object({
	stylesheet: stylesheetSchema.optional(),
	origin: originSchema.optional(),
	name: z.string().max(Config.DEFAULT_MAX_LENGTH),
});

export type CreateBox = z.infer<typeof createBoxSchema>;
