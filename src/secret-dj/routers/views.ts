import express from "express";
import { checkParticipation, enforceParticipation } from "../middlewares/checkParticipation";
import { createParticipant } from "../operations/createParticipant";
import { Email } from "@prisma/client";
import { signupPayloadSchema } from "../schemas";

export const views = express()
	.use(checkParticipation)
	// TODO if participating, just redirect
	.get("/signup", (req, res) => res.render("pages/secret-dj/signup", { error: "" }))
	.post("/signup", async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const { name } = signupPayloadSchema.parse(req.body);
			await createParticipant({ emailId: email.id, name });
			return res.redirect("/secret-dj");
		} catch (error) {
			return res.render("pages/secret-dj/signup", { error: "that didn't quite work" });
		}
	})
	.use("/*", enforceParticipation)
	.get("/", (req, res) => {
		return res.render("pages/secret-dj/index", {
			locals: res.locals,
		});
	});
