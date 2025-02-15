import { z } from "zod";
import { originSchema } from "./origin.js";
import Config from "../../Config.js";
import { checkboxSchema } from "../../schema.js";

export const createCounterSchema = z.object({
	origin: originSchema.optional(),
	name: z.string().max(Config.DEFAULT_MAX_LENGTH),
	unique: checkboxSchema,
});

export type CreateCounter = z.infer<typeof createCounterSchema>;
