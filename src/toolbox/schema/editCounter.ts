import { z } from "zod";
import Config from "../../Config.js";
import { originSchema } from "./origin.js";
import { checkboxSchema } from "../../schema.js";

export const editCounterSchema = z.object({
	name: z.string().min(0).max(Config.DEFAULT_MAX_LENGTH),
	origin: originSchema,
	value: z.coerce.number().int(),
	unique: checkboxSchema,
});
