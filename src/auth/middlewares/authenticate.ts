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

export const authenticateCookie = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = String(req.cookies.token);
		res.locals.email = await authenticate(token);
		res.locals.token = token;
		res.locals.logged = true;
	} catch {
		res.locals.logged = false;
	}
	return next();
};

export const checkLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.logged) {
		if (req.query.redirect && typeof req.query.redirect === "string") {
			return res.redirect(req.query.redirect);
		} else {
			return res.redirect("/");
		}
	} else {
		return next();
	}
};

export const enforceLoggedIn = (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.logged) {
		return next();
	} else if (req.originalUrl === "/") {
		return res.redirect("/login");
	} else {
		return res.redirect(`/login?${new URLSearchParams({ redirect: req.originalUrl })}`);
	}
};
