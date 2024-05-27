import { z } from "zod";
import { originSchema } from "./origin";

export const editBoxSchema = z.object({
	origin: originSchema.optional(),
	name: z.string().optional(),
});

export type EditBox = z.infer<typeof editBoxSchema>;
