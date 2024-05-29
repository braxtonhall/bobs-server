import { z } from "zod";

export const stylesheetSchema = z
	.string()
	.transform((address) => address.trim())
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
