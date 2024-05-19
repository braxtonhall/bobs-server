import express from "express";
import https from "https";
import fs from "fs/promises";
import Config from "./Config";
import http from "http";
import cookieParser from "cookie-parser";
import { views as authViews } from "./auth/routers/views";
import bodyParser from "body-parser";
import { authenticateCookie } from "./auth/middlewares/authenticate";
import { unauthenticated } from "./toolbox/routers/unauthenticated";
import { authenticated } from "./toolbox/routers/authenticated";

// TODO would be nice to also have a basic iframe for people who do not want to implement on their own
//  iframe should be able to inherit either style tags or links to style
//  this is set via url query parameter, and there is a URL builder on the admin site for "create iframe"
//  that includes a preview of the iframe and example HTML
//  on a site like embed.bobs-server.net/...
// TODO would be great to also serve a javascript client

// TODO this whole system is a mess...
export const app = express()
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.use(cookieParser())
	.use(authViews)
	.use(unauthenticated)
	.use(authenticateCookie)
	.use(authenticated) // TODO authenticateCookie shouldn't apply to the api routes :/
	.set("view engine", "ejs")
	.get("/", (req, res) => res.render("pages/index"));

export const getServers = async () => ({
	// TODO if request is not secure, you need to REDIRECT!!
	https: https.createServer(
		{
			cert: await fs.readFile(Config.SSL_CERT_PATH),
			key: await fs.readFile(Config.SSL_KEY_PATH),
		},
		app,
	),
	http: http.createServer(app),
});
