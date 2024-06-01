import { z } from "zod";
import Config from "../../Config";

export const originSchema = z
	.string()
	.trim()
	.max(Config.DEFAULT_MAX_LENGTH)
	.transform((address, ctx): string | undefined => {
		if (address === "") {
			return undefined;
		}
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
