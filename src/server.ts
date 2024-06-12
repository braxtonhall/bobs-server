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
import emails from "./toolbox/storage/emails";
import { parse } from "./parse";
import { match, P } from "ts-pattern";
import { Ok } from "./types/result";
import session from "express-session";
import { settingsSchema } from "./schema";

// TODO would be great to also serve a javascript client
// TODO this whole system is a mess...

const views = express()
	.set("view engine", "ejs")
	.use("/public", express.static("public"))
	.use(session({ secret: Config.SESSION_SECRET, cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.use(cookieParser())
	.use(authenticateCookie)
	.use(authViews)
	.use("/secret-dj", secretDjViews)
	.use(unauthenticatedViews)
	.use("/toolbox", enforceLoggedIn, adminViews)
	.use(enforceLoggedIn)
	.get("/settings", (req, res) =>
		res.render("pages/settings", {
			subscribed: res.locals.email.subscribed,
			error: "",
			success: "",
			Config,
		}),
	)
	.post("/settings", async (req, res) => {
		const result = parse(settingsSchema, req.body);
		return match(result)
			.with(Ok(P.select()), async ({ subscribed }) => {
				await emails.updateSettings(res.locals.email.id, subscribed);
				return res.render("pages/settings", { subscribed, error: "", success: "saved", Config });
			})
			.otherwise(() =>
				res.render("pages/settings", {
					subscribed: res.locals.email.subscribed,
					error: "that didn't work",
					success: "",
					Config,
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
	http: http.createServer(
		express()
			.use(api)
			.use((req, res) => res.redirect(`https://${Config.HOST}${req.originalUrl}`)),
	),
});
