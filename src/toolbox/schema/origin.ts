import { z } from "zod";

export const originSchema = z
	.string()
	.transform((address) => address.trim())
	.transform((address, ctx): string => {
		if (address === "*") {
			return address;
		}
		try {
			const { origin } = new URL(address);
			if (origin !== "null") {
				return origin;
			}
		} catch {
			// Do nothing :)
		}
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Origin should be a website url",
		});
		return z.NEVER;
	});
