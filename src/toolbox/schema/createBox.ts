import { z } from "zod";
import { originSchema } from "./origin";
import { stylesheetSchema } from "./stylesheet";

export const createBoxSchema = z.object({
	stylesheet: stylesheetSchema.optional(),
	origin: originSchema.optional(),
	name: z.string(),
});

export type CreateBox = z.infer<typeof createBoxSchema>;
