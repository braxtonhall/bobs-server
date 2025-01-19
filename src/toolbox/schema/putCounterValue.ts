import { z } from "zod";

export const putCounterValue = z.object({
	value: z.number().int(),
});
