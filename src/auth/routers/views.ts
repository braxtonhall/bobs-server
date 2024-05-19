import express from "express";
import { authorize, deauthenticate, login } from "../operations";
import Config from "../../Config";

const tokenMaxAge = Config.API_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000;

export const views = express()
	.get("/login", (req, res) => res.render("pages/login"))
	.post("/login", (req, res) => {
		// TODO if already logged in, redirect to index
		const email: string = req.body.email; // TODO use a proper zod parser
		void login({ email, protocol: req.protocol }).catch(() => {});
		const emailURIComponent = encodeURIComponent(email);
		return res.redirect(`/authorize?email=${emailURIComponent}`);
	})
	.get("/authorize", async (req, res) => {
		// TODO if already logged in, redirect to index
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
	.get("/logout", async (req, res) => {
		if (typeof req.cookies.token === "string") {
			await deauthenticate(String(req.cookies.token)).catch(() => {});
		}
		res.clearCookie("token");
		return res.redirect("/login");
	});
