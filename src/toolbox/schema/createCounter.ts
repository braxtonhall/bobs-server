import { z } from "zod";
import { originSchema } from "./origin";
import Config from "../../Config";

export const createCounterSchema = z.object({
	origin: originSchema.optional(),
	name: z.string().max(Config.DEFAULT_MAX_LENGTH),
});

export type CreateCounter = z.infer<typeof createCounterSchema>;
