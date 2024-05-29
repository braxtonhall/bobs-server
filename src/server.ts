import express from "express";
import https from "https";
import fs from "fs/promises";
import Config from "./Config";
import http from "http";
import cookieParser from "cookie-parser";
import { views as authViews } from "./auth/routers/views";
import bodyParser from "body-parser";
import { authenticateCookie, enforceLoggedIn } from "./auth/middlewares/authenticate";
import { api as unauthenticatedApi, views as unauthenticatedViews } from "./toolbox/routers/unauthenticated";
import { views as secretDjViews } from "./secret-dj/routers/views";
import subdomain from "express-subdomain";
import { adminViews } from "./toolbox/routers/views";
import { z } from "zod";
import emails from "./toolbox/storage/emails";
import { parse } from "./parse";
import { match, P } from "ts-pattern";
import { Ok } from "./types/result";

// TODO would be nice to also have a basic iframe for people who do not want to implement on their own
//  iframe should be able to inherit either style tags or links to style
//  this is set via url query parameter, and there is a URL builder on the admin site for "create iframe"
//  that includes a preview of the iframe and example HTML
//  on a site like embed.bobs-server.net/...
// TODO would be great to also serve a javascript client

// TODO this whole system is a mess...

const views = express()
	.set("view engine", "ejs")
	.use("/public", express.static("public"))
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.use(cookieParser())
	.use(authenticateCookie)
	.use(authViews)
	.use("/secret-dj", enforceLoggedIn, secretDjViews)
	.use(unauthenticatedViews)
	.use("/toolbox", enforceLoggedIn, adminViews)
	.use(enforceLoggedIn)
	.get("/settings", (req, res) =>
		res.render("pages/settings", {
			subscribed: res.locals.email.subscribed,
			error: "",
			success: "",
		}),
	)
	.post("/settings", async (req, res) => {
		const result = parse(
			z.object({
				subscribed: z
					.literal("on")
					.optional()
					.transform((on) => on === "on"),
			}),
			req.body,
		);
		return match(result)
			.with(Ok(P.select()), async ({ subscribed }) => {
				await emails.updateSettings(res.locals.email.id, subscribed);
				return res.render("pages/settings", { subscribed, error: "", success: "saved" });
			})
			.otherwise(() =>
				res.render("pages/settings", {
					subscribed: res.locals.email.subscribed,
					error: "that didn't work",
					success: "",
				}),
			);
	})
	.get("/", (req, res) => res.render("pages/index"));

const api = express().use(subdomain("api", unauthenticatedApi));

export const getServers = async () => ({
	// TODO if request is not secure, you need to REDIRECT!!
	https: https.createServer(
		{
			cert: await fs.readFile(Config.SSL_CERT_PATH),
			key: await fs.readFile(Config.SSL_KEY_PATH),
		},
		express().use(api).use(views),
	),
	http: http.createServer(api), // TODO some of the views we might want over http as well
});
