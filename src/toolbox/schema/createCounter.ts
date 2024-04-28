import { z } from "zod";
import { originSchema } from "./origin";

export const createCounterSchema = z.object({
	origin: originSchema,
	name: z.string(),
});

export type CreateCounter = z.infer<typeof createCounterSchema>;
