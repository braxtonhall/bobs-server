import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { authenticateCookie } from "../../auth/middlewares/authenticate";
import { createDocument, DocumentType } from "../operations/createDocument";
import { deleteDocument } from "../operations/deleteDocument";
import { addCollaborator } from "../operations/addCollaborator";
import { removeCollaborator } from "../operations/removeCollaborator";
import { Email } from "@prisma/client";

const DOCUMENT_TYPES = new Set<DocumentType>(["private", "public", "shared"]);

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
			const type: DocumentType = DOCUMENT_TYPES.has(req.body?.type) ? req.body.type : "private";
			const id = await createDocument({ ownerId: email.id, type });
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
	})
	.post("/documents/:id/collaborators", async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const emailAddress: unknown = req.body?.email;
			if (typeof emailAddress !== "string") return res.sendStatus(400);
			await addCollaborator({ documentId: req.params.id, ownerId: email.id, emailAddress });
			return res.sendStatus(200);
		} catch {
			return res.sendStatus(404);
		}
	})
	.delete("/documents/:id/collaborators/:email", async (req, res) => {
		try {
			const email: Email = res.locals.email;
			await removeCollaborator({
				documentId: req.params.id,
				ownerId: email.id,
				emailAddress: req.params.email,
			});
			return res.sendStatus(200);
		} catch {
			return res.sendStatus(404);
		}
	});
