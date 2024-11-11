import { NextFunction, Request, Response } from "express";
import { Email } from "@prisma/client";
import { db } from "../../db";

export const getViewing = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.logged) {
		const email: Email = res.locals.email;
		const viewer = await db.viewer.findUnique({ where: { emailId: email.id } });
		if (viewer) {
			res.locals.viewer = viewer;
			res.locals.viewing = true;
			return next();
		}
	}
	res.locals.viewing = false;
	return next();
};

export const checkViewing = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.viewing) {
		if (req.query.next && typeof req.query.next === "string") {
			return res.redirect(req.query.next);
		} else {
			return res.redirect("/trek");
		}
	} else {
		return next();
	}
};

export const enforceViewing = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.viewing) {
		return next();
	} else if (req.originalUrl === "/trek") {
		return res.redirect("/trek/signup");
	} else {
		return res.redirect(`/trek/signup?${new URLSearchParams({ next: req.originalUrl })}`);
	}
};