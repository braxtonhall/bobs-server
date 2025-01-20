import { z } from "zod";
import Config from "../../Config";
import { originSchema } from "./origin";
import { checkboxSchema } from "../../schema";

export const editCounterSchema = z.object({
	name: z.string().min(0).max(Config.DEFAULT_MAX_LENGTH),
	origin: originSchema,
	value: z.coerce.number().int(),
	unique: checkboxSchema,
	increment: z.coerce.number().int(),
	allowApiInc: checkboxSchema,
	allowApiSet: checkboxSchema,
	allowApiGet: checkboxSchema,
});
