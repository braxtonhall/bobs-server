import { z } from "zod";
import { originSchema } from "./origin";
import Config from "../../Config";
import { checkboxSchema } from "../../schema";

export const createCounterSchema = z.object({
	origin: originSchema.optional(),
	name: z.string().max(Config.DEFAULT_MAX_LENGTH),
	unique: checkboxSchema,
});

export type CreateCounter = z.infer<typeof createCounterSchema>;
