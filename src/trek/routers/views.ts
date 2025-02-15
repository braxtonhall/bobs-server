import express from "express";
import { checkViewing, getViewing } from "../middlewares/checkViewing.js";
import { enforceLoggedIn } from "../../auth/middlewares/authenticate.js";
import Config from "../../Config.js";
import { Email } from "@prisma/client";
import { signupPayloadSchema } from "../schemas.js";
import { setViewing } from "../operations/setViewing.js";

export const views = express()
	.use(getViewing)
	// TODO delete all this stuff
	.get("/signup", enforceLoggedIn, checkViewing, (_req, res) =>
		res.render("pages/trek/signup", { locals: res.locals, Config }),
	)
	.post("/signup", enforceLoggedIn, checkViewing, async (req, res) => {
		try {
			const email: Email = res.locals.email;
			const { name } = signupPayloadSchema.parse(req.body);
			await setViewing({ emailId: email.id, name });
			return res.redirect(req.originalUrl);
		} catch (error) {
			return res.render("pages/trek/signup", { error: "that didn't quite work", Config });
		}
	})
	.use(express.static("public/trek"))
	.use("/", (_req, res) => res.sendFile("trek/index.html", { root: "public" }));
