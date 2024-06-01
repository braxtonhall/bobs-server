import express from "express";
import { authorize, completeVerification, deauthenticate, login } from "../operations";
import Config from "../../Config";
import { checkLoggedIn } from "../middlewares/authenticate";
import { authorizePayloadSchema } from "../schemas";
import { Duration } from "luxon";

const tokenMaxAge = Duration.fromObject({ hour: Config.API_TOKEN_EXPIRATION_HOURS }).toMillis();

export const views = express()
	.get("/verify", async (req, res) => {
		try {
			const { email, token: temporaryToken } = authorizePayloadSchema.parse(req.query);
			await completeVerification({ email, temporaryToken, subscribed: true });
			return res.render("pages/verified");
		} catch {
			return res.sendStatus(404);
		}
	})
	.get("/unsubscribe", async (req, res) => {
		try {
			const { email, token: temporaryToken } = authorizePayloadSchema.parse(req.query);
			await completeVerification({ email, temporaryToken, subscribed: false });
			return res.render("pages/unsubscribed");
		} catch {
			return res.sendStatus(404);
		}
	})
	.get("/login", checkLoggedIn, (req, res) => res.render("pages/login", { query: req.query }))
	.post("/login", checkLoggedIn, (req, res) => {
		const email: string = req.body.email;
		void login({
			email,
			redirect: typeof req.body.redirect === "string" ? req.body.redirect : undefined,
		}).catch(() => {});
		return res.redirect(
			`/authorize?${new URLSearchParams({ email, ...(req.body.redirect && { redirect: req.body.redirect }) })}`,
		);
	})
	.get("/authorize", checkLoggedIn, async (req, res) => {
		const result = authorizePayloadSchema.safeParse(req.query);
		if (!result.success) {
			return res.render("pages/authorize", { query: req.query, error: result.error.message });
		}
		try {
			const { email, token: temporaryToken } = result.data;
			const token = await authorize({ email, temporaryToken });
			res.cookie("token", token, { sameSite: "none", secure: true, maxAge: tokenMaxAge });
			return res.redirect(req.originalUrl);
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
