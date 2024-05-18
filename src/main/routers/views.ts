import express from "express";
import { authenticate, authorize, deauthenticate, login } from "../../auth/operations";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import Config from "../../Config";

const tokenMaxAge = Config.API_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000;

export const views = express()
	.set("view engine", "ejs")
	.use(cookieParser())
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.get("/login", (req, res) => res.render("pages/login"))
	.post("/login", (req, res) => {
		const email: string = req.body.email; // TODO use a proper zod parser
		void login({ email }).catch();
		const emailURIComponent = encodeURIComponent(email);
		return res.redirect(`/authorize?email=${emailURIComponent}`);
	})
	.get("/authorize", async (req, res) => {
		if (typeof req.query.email === "string" && typeof req.query.token === "string") {
			const { email, token: temporaryToken } = req.query as Record<string, string>; // TODO use a zod parser
			try {
				const token = await authorize({ email, temporaryToken });
				res.cookie("token", token, { sameSite: "none", secure: true, maxAge: tokenMaxAge });
				return res.redirect("/");
			} catch {
				return res.redirect("/login");
			}
		} else {
			return res.render("pages/authorize", req.query);
		}
	})
	.use(async (req, res, next) => {
		try {
			const token = String(req.cookies.token);
			res.locals.email = await authenticate(token);
			res.locals.token = token;
			return next();
		} catch {
			return res.redirect("/login");
		}
	})
	.get("/logout", async (req, res) => {
		await deauthenticate(String(req.cookies.token)).catch();
		res.clearCookie("token");
		return res.redirect("/login");
	})
	.get("/*", (req, res) => res.render("pages/index"));
