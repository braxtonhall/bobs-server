import { z } from "zod";
import Config from "../../Config";

export const stylesheetSchema = z
	.string()
	.trim()
	.max(Config.DEFAULT_MAX_LENGTH)
	.transform((address, ctx): string | undefined => {
		if (address === "") {
			return undefined;
		}
		try {
			return new URL(address).toString();
		} catch {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Origin should be a website url",
			});
			return z.NEVER;
		}
	});
