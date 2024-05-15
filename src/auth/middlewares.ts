import { Request, Response, NextFunction } from "express";
import { authenticate } from "./operations";

const authenticateToken = async (token: string, res: Response, next: NextFunction) => {
	try {
		res.locals.email = await authenticate(token);
		return next();
	} catch (e) {
		return res.sendStatus(401);
	}
};

export const authenticateHeader = async (req: Request, res: Response, next: NextFunction) => {
	const { authorization } = req.headers;
	if (authorization === undefined || !authorization.startsWith("Bearer ")) {
		return res.sendStatus(401);
	}
	const token = authorization.replace("Bearer ", "");
	return authenticateToken(token, res, next);
};

export const authenticateCookie = async (req: Request, res: Response, next: NextFunction) => {
	// TODO add cookie parser
	// const req.cookies['']
	// res.cookie('cookieName', 'cookieValue', { sameSite: 'none', secure: true});
	const token: string = "AUTHORIZATION TOKEN FROM COOKIE"; // TODO
	return authenticateToken(token, res, next);
};
