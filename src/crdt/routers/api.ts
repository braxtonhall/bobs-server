import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { authenticateCookie } from "../../auth/middlewares/authenticate";
import { createDocument } from "../operations/createDocument";
import { deleteDocument } from "../operations/deleteDocument";
import { Email } from "@prisma/client";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
	if (res.locals.logged) return next();
	return res.sendStatus(401);
};

export const router = express()
	.use(cookieParser())
	.use(authenticateCookie)
	.use(requireAuth)
	.post("/documents", async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const id = await createDocument({ ownerId: email.id });
			return res.status(201).json({ id });
		} catch {
			return res.sendStatus(500);
		}
	})
	.delete("/documents/:id", async (req, res) => {
		try {
			const email: Email = res.locals.email;
			await deleteDocument({ documentId: req.params.id, ownerId: email.id });
			return res.sendStatus(200);
		} catch {
			return res.sendStatus(404);
		}
	});
