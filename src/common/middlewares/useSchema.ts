import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const useSchema = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
	const result = schema.safeParse(req.body);
	if (result.success) {
		req.body = result.data;
		return next();
	} else {
		return res.send(result.error).status(404);
	}
};
