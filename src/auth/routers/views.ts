import express from "express";
import { authorize, deauthenticate, login } from "../operations";
import Config from "../../Config";
import { checkLoggedIn } from "../middlewares/authenticate";
import { authorizePayloadSchema } from "../schemas";

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
		const result = authorizePayloadSchema.safeParse(req.query);
		if (!result.success) {
			return res.render("pages/authorize", { query: req.query, error: "" });
		}
		try {
			const { email, token: temporaryToken } = result.data;
			const token = await authorize({ email, temporaryToken });
			res.cookie("token", token, { sameSite: "none", secure: true, maxAge: tokenMaxAge });
			return res.redirect("back");
		} catch {
			return res.render("pages/authorize", {
				query: req.query,
				error: "that token was not correct or was expired",
			});
		}
	})
	.get("/logout", async (req, res) => {
		res.locals.logged && (await deauthenticate(res.locals.token).catch(() => {}));
		res.clearCookie("token");
		return res.redirect("/login");
	});
