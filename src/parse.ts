import { z, ZodSchema } from "zod";
import { match, P } from "ts-pattern";
import { Err, Ok, Result } from "./types/result.js";

export const parse = <S extends ZodSchema>(schema: S, input: unknown): Result<z.infer<S>, string> =>
	match(schema.safeParse(input))
		.with({ success: true, data: P.select() }, Ok)
		.with({ success: false, error: P.select() }, ({ message }) => Err(message))
		.exhaustive();
