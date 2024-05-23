import express from "express";
import { authorize, deauthenticate, login } from "../operations";
import Config from "../../Config";
import { checkLoggedIn } from "../middlewares/authenticate";

const tokenMaxAge = Config.API_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000;

export const views = express()
	.get("/login", checkLoggedIn, (req, res) => res.render("pages/login", { query: req.query }))
	.post("/login", (req, res) => {
		const email: string = req.body.email;
		void login({ email, protocol: req.protocol }).catch(() => {});
		return res.redirect(
			`/authorize?${new URLSearchParams({ email, ...(req.body.redirect && { redirect: req.body.redirect }) })}`,
		);
	})
	.get("/authorize", checkLoggedIn, async (req, res) => {
		if (typeof req.query.email === "string" && typeof req.query.token === "string") {
			const { email, token: temporaryToken } = req.query as Record<string, string>; // TODO use a zod parser
			try {
				const token = await authorize({ email, temporaryToken });
				res.cookie("token", token, { sameSite: "none", secure: true, maxAge: tokenMaxAge });
				return res.redirect("back");
			} catch {
				return res.render("pages/authorize", {
					query: req.query,
					error: "that token was not correct or was expired",
				});
			}
		} else {
			return res.render("pages/authorize", { query: req.query, error: "" });
		}
	})
	.get("/logout", async (req, res) => {
		if (typeof req.cookies.token === "string") {
			await deauthenticate(req.cookies.token).catch(() => {});
		}
		res.clearCookie("token");
		return res.redirect("/login");
	});
