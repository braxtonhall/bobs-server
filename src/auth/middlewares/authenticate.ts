import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, rotateRefreshToken } from "../operations";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, setAuthCookies, clearAuthCookies } from "../cookies";

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
	try {
		res.locals.email = verifyAccessToken(req.cookies[ACCESS_TOKEN_COOKIE]);
		res.locals.logged = true;
		return next();
	} catch {
		const refreshCookie = req.cookies[REFRESH_TOKEN_COOKIE];
		if (refreshCookie) {
			try {
				const { accessToken, refreshToken, email } = await rotateRefreshToken(refreshCookie);
				setAuthCookies(res, { accessToken, refreshToken });
				res.locals.email = email;
				res.locals.logged = true;
				return next();
			} catch {
				clearAuthCookies(res);
			}
		}
		res.locals.logged = false;
		return next();
	}
};

export const authenticateCookie = async (req: Request, res: Response, next: NextFunction) =>
	authenticateToken(req, res, next);

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
