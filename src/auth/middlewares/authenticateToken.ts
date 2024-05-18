import { Request, Response, NextFunction } from "express";
import { authenticate } from "../operations";

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
	const { authorization } = req.headers;
	if (authorization === undefined || !authorization.startsWith("Bearer ")) {
		return res.sendStatus(401);
	}
	const token = authorization.replace("Bearer ", "");

	try {
		res.locals.email = await authenticate(token);
		return next();
	} catch (e) {
		return res.sendStatus(401);
	}
};

export const authenticateCookie = async (_req: Request, _res: Response, _next: NextFunction) => {
	// TODO add cookie parser
	// const req.cookies['']
	// res.cookie('cookieName', 'cookieValue', { sameSite: 'none', secure: true})
};
