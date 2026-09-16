import express from "express";
import { authorize, completeVerification, deauthenticate, login } from "../operations";
import Config from "../../Config";
import { checkLoggedIn } from "../middlewares/authenticate";
import { authorizePayloadSchema, loginPayloadSchema } from "../schemas";
import slowDown from "express-slow-down";
import { recaptcha } from "../middlewares/recaptcha";
import { REFRESH_TOKEN_COOKIE, clearAuthCookies, setAuthCookies } from "../cookies";

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
	.get("/login", checkLoggedIn, (req, res) => res.render("pages/login", { query: req.query, Config }))
	.post(
		"/login",
		slowDown({
			windowMs: 15 * 60 * 1000, // 15 minutes
			delayAfter: 2, // Allow 2 requests per 15 minutes.
			delayMs: (hits) => hits * 1000, // Add 1s of delay to every request after the 2nd one.
		}),
		checkLoggedIn,
		recaptcha,
		async (req, res) => {
			try {
				const { email } = loginPayloadSchema.parse(req.body);
				await login({
					email,
					next: typeof req.body.next === "string" ? req.body.next : undefined,
				});
				return res.redirect(
					`/authorize?${new URLSearchParams({ email, ...(req.body.next && { next: req.body.next }) })}`,
				);
			} catch (error) {
				return res.sendStatus(400);
			}
		},
	)
	.get("/authorize", checkLoggedIn, async (req, res) => {
		const result = authorizePayloadSchema.safeParse(req.query);
		if (!result.success) {
			return res.render("pages/authorize", { query: req.query, error: "", Config });
		}
		try {
			const { email, token: temporaryToken } = result.data;
			const { accessToken, refreshToken } = await authorize({ email, temporaryToken });
			setAuthCookies(res, { accessToken, refreshToken });
			return res.redirect(req.originalUrl);
		} catch {
			return res.render("pages/authorize", {
				query: req.query,
				error: "that password was not correct. it may be expired or already used",
				Config,
			});
		}
	})
	.get("/logout", async (req, res) => {
		const refreshCookie = req.cookies[REFRESH_TOKEN_COOKIE];
		refreshCookie && (await deauthenticate(refreshCookie).catch(() => {}));
		clearAuthCookies(res);
		return res.redirect("/login");
	});
