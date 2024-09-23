import { Request, Response, NextFunction } from "express";
import { authenticate } from "../operations";

const authenticateToken = async (token: string, res: Response, next: NextFunction) => {
	try {
		res.locals.email = await authenticate(token);
		res.locals.token = token;
		res.locals.logged = true;
	} catch {
		res.locals.logged = false;
	}
	return next();
};

export const authenticateCookie = async (req: Request, res: Response, next: NextFunction) =>
	authenticateToken(req.cookies.token, res, next);

export const authenticateHeader = async (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization || "";
	const match = authHeader.match(/Bearer (.*)/);
	return authenticateToken(match?.[1] ?? "", res, next);
};

export const checkLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.logged) {
		if (req.query.next && typeof req.query.next === "string") {
			return res.redirect(req.query.next);
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
		return res.redirect(`/login?${new URLSearchParams({ next: req.originalUrl })}`);
	}
};
