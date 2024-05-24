import { NextFunction, Request, Response } from "express";
import { Email } from "@prisma/client";
import { db } from "../../db";

export const getParticipation = async (req: Request, res: Response, next: NextFunction) => {
	const email: Email = res.locals.email;
	const participant = await db.participant.findUnique({ where: { emailId: email.id } });
	if (participant) {
		res.locals.participant = participant;
		res.locals.participating = true;
	} else {
		res.locals.participating = false;
	}
	return next();
};

export const checkParticipation = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.participating) {
		if (req.query.redirect && typeof req.query.redirect === "string") {
			return res.redirect(req.query.redirect);
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
		return res.redirect(`/secret-dj/signup?${new URLSearchParams({ redirect: req.originalUrl })}`);
	}
};
