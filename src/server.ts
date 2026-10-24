import express from "express";
import https from "https";
import fs from "fs/promises";
import Config from "./Config";
import commitSha from "./commitSha";
import http from "http";
import cookieParser from "cookie-parser";
import { views as authViews } from "./auth/routers/views";
import { api as ssoApi, views as ssoViews } from "./auth/routers/sso";
import bodyParser from "body-parser";
import { authenticateCookie, enforceLoggedIn } from "./auth/middlewares/authenticate";
import { api as unauthenticatedApi, views as unauthenticatedViews } from "./toolbox/routers/unauthenticated";
import { views as secretDjViews } from "./secret-dj/routers/views";
import { adminViews } from "./toolbox/routers/views";
import { views as settingsViews } from "./settings/routers/views";
import session from "express-session";
import { gateKeepInvalidURIs } from "./common/middlewares/gateKeepInvalidURIs";

// TODO would be great to also serve a javascript client
// TODO this whole system is a mess...

const views = express()
	.set("view engine", "ejs")
	.use("/public", express.static("public"))
	.use(gateKeepInvalidURIs)
	// as any needed because https://github.com/expressjs/session/issues/1007
	.use(
		session({
			secret: Config.SESSION_SECRET,
			cookie: { maxAge: 60000 },
			resave: true,
			saveUninitialized: true,
		}) as any,
	)
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.use(cookieParser())
	.use(authenticateCookie)
	.use(authViews)
	.use(ssoViews)
	.use("/secret-dj", secretDjViews)
	.use(unauthenticatedViews)
	.use("/toolbox", enforceLoggedIn, adminViews)
	.use(enforceLoggedIn)
	.use("/settings", settingsViews)
	.get("/", (req, res) => res.render("pages/index", { commitSha }))
	.get("/*", (req, res) => res.sendStatus(404));

const api = express().use(
	"/api",
	express()
		.use(ssoApi)
		.use(unauthenticatedApi)
		.get("/", (req, res) => res.send("API")),
);

export const createApp = () => {
	const app = express().use(api).use(views);
	if (Config.TRUST_PROXY !== undefined) {
		app.set("trust proxy", Config.TRUST_PROXY);
	}
	return app;
};

export const getServers = async (): Promise<{ http: http.Server; https?: https.Server }> => {
	if (Config.SSL_CERT_PATH === undefined || Config.SSL_KEY_PATH === undefined) {
		// Behind a reverse proxy that terminates TLS.
		return { http: http.createServer(createApp()) };
	}
	return {
		https: https.createServer(
			{
				cert: await fs.readFile(Config.SSL_CERT_PATH),
				key: await fs.readFile(Config.SSL_KEY_PATH),
			},
			createApp(),
		),
		http: http.createServer(
			express()
				.use(api)
				.use((req, res) => res.redirect(`https://${Config.HOST}${req.originalUrl}`)),
		),
	};
};
