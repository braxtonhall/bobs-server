import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { enforceLoggedIn } from "../middlewares/authenticate";
import { exchangeSsoCode, isAllowedRedirect, isExchangeAuthorized, issueSsoCode, ssoEnabled } from "../sso";

const MAX_STATE_LENGTH = 256;

const ssoQuerySchema = z.object({
	redirect: z.string().refine(isAllowedRedirect),
	state: z.string().min(1).max(MAX_STATE_LENGTH),
});

const exchangeBodySchema = z.object({
	code: z.string().min(1).max(MAX_STATE_LENGTH),
	redirect: z.string(),
});

const requireSsoEnabled = (req: Request, res: Response, next: NextFunction) =>
	ssoEnabled() ? next() : res.sendStatus(404);

/** Sends a logged-in user back to an allowlisted service with a one-time code (see docs/sso.md). */
export const views = express().get("/sso", requireSsoEnabled, enforceLoggedIn, async (req, res) => {
	const result = ssoQuerySchema.safeParse(req.query);
	if (!result.success) {
		// Never redirect anywhere that isn't on the allowlist.
		return res.sendStatus(400);
	}
	const { redirect, state } = result.data;
	try {
		const code = await issueSsoCode({ emailId: res.locals.email.id, redirect });
		const url = new URL(redirect);
		url.searchParams.set("code", code);
		url.searchParams.set("state", state);
		return res.redirect(url.toString());
	} catch {
		return res.sendStatus(500);
	}
});

/** Server-to-server: trades a code for the identity it was issued to. Requires the shared secret. */
export const api = express().post("/sso/exchange", requireSsoEnabled, express.json(), async (req, res) => {
	if (!isExchangeAuthorized(req.header("authorization"))) {
		return res.sendStatus(401);
	}
	const result = exchangeBodySchema.safeParse(req.body);
	if (!result.success) {
		return res.sendStatus(400);
	}
	try {
		return res.json(await exchangeSsoCode(result.data));
	} catch {
		return res.status(400).json({ error: "invalid_code" });
	}
});
