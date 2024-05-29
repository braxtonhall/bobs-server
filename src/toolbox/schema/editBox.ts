import { z } from "zod";
import { originSchema } from "./origin";
import { stylesheetSchema } from "./stylesheet";

export const editBoxSchema = z.object({
	stylesheet: stylesheetSchema.optional(),
	origin: originSchema.optional(),
	name: z.string().optional(),
});

export type EditBox = z.infer<typeof editBoxSchema>;
