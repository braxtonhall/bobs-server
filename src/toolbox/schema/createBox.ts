import { z } from "zod";
import { originSchema } from "./origin";

export const createBoxSchema = z.object({
	origin: originSchema,
	name: z.string(),
});

export type CreateBox = z.infer<typeof createBoxSchema>;
