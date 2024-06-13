import { Request, Response, NextFunction } from "express";

export const gateKeepInvalidURIs = (req: Request, res: Response, next: NextFunction) => {
	try {
		decodeURIComponent(req.path);
		return next();
	} catch {
		return res.sendStatus(404);
	}
};
