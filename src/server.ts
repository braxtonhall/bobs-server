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
	.use(session({ secret: Config.SESSION_SECRET, cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.use(cookieParser())
	.use(authenticateCookie)
	.use(authViews)
	.use("/secret-dj", secretDjViews)
	.use(unauthenticatedViews)
	.use("/toolbox", enforceLoggedIn, adminViews)
	.use(enforceLoggedIn)
	.use("/settings", settingsViews)
	.get("/", (req, res) => res.render("pages/index"))
	.get("/*", (req, res) => res.sendStatus(404));

const api = express().use(
	"/api",
	express()
		.use(unauthenticatedApi)
		.get("/", (req, res) => res.send("API")),
);

export const getServers = async () => ({
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
