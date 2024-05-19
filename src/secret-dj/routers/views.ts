import express from "express";
import { checkParticipation } from "../middlewares/checkParticipation";
import { createParticipant } from "../operations/createParticipant";
import { Email } from "@prisma/client";

export const views = express()
	.get("/signup", (req, res) => res.render("pages/secret-dj/signup"))
	.post("/signup", async (req, res) => {
		const email: Email = res.locals.email;
		const name = req.body.name; // TODO use a zod parser
		await createParticipant({ emailId: email.id, name });
		return res.redirect("/secret-dj");
	})
	.use("/*", checkParticipation)
	.get("/", (req, res) => {
		return res.render("pages/secret-dj/index", {
			locals: res.locals,
		});
	});
