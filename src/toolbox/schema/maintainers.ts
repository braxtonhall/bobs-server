import { z } from "zod";
import { emailSchema } from "./email";
import { checkboxSchema } from "../../util/checkboxSchema";

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
