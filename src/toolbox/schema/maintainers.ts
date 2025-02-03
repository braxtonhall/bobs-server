import { z } from "zod";
import { emailSchema } from "./email.js";
import { checkboxSchema } from "../../schema.js";

export const removeMaintainerPayloadSchema = z.object({
	email: emailSchema,
});

export const addMaintainerPayloadSchema = removeMaintainerPayloadSchema.and(
	z.object({
		details: checkboxSchema,
		kill: checkboxSchema,
		delete: checkboxSchema,
		permissions: checkboxSchema,
	}),
);
