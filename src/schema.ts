import { z } from "zod";

export const checkboxSchema = z
	.literal("on")
	.optional()
	.transform((on) => on === "on");

export const settingsSchema = z.object({
	subscribed: checkboxSchema,
});
