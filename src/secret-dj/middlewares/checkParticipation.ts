import { NextFunction, Request, Response } from "express";
import { Email } from "@prisma/client";
import { db } from "../../db.js";

export const getParticipation = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.logged) {
		const email: Email = res.locals.email;
		const participant = await db.participant.findUnique({ where: { emailId: email.id } });
		if (participant) {
			res.locals.participant = participant;
			res.locals.participating = true;
			return next();
		}
	}
	res.locals.participating = false;
	return next();
};

export const checkParticipation = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.participating) {
		if (req.query.next && typeof req.query.next === "string") {
			return res.redirect(req.query.next);
		} else {
			return res.redirect("/secret-dj");
		}
	} else {
		return next();
	}
};

export const enforceParticipation = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.participating) {
		return next();
	} else if (req.originalUrl === "/secret-dj") {
		return res.redirect("/secret-dj/signup");
	} else {
		return res.redirect(`/secret-dj/signup?${new URLSearchParams({ next: req.originalUrl })}`);
	}
};
