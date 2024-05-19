import { NextFunction, Request, Response } from "express";
import { Email } from "@prisma/client";
import { db } from "../../db";

export const checkParticipation = async (req: Request, res: Response, next: NextFunction) => {
	const email: Email = res.locals.email;
	const participant = await db.participant.findUnique({ where: { emailId: email.id } });
	if (participant) {
		res.locals.participant = participant;
		return next();
	} else {
		return res.redirect("/secret-dj/signup");
	}
};
