import { NextFunction, Request, Response } from "express";
import { Email } from "@prisma/client";
import { db } from "../../db";

export const enforceParticipation = async (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.participating) {
		return next();
	} else {
		return res.redirect("/secret-dj/signup");
	}
};

export const checkParticipation = async (req: Request, res: Response, next: NextFunction) => {
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
