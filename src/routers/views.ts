import express from "express";
import { getPosts } from "../operations/getPosts";
import { hashString } from "../util";
import { match, P } from "ts-pattern";
import { Ok } from "../types/result";

export const views = express()
	.set("view engine", "ejs")
	.get("/boxes/:box", async (req, res) =>
		match(await getPosts(req.params.box, hashString(req.ip ?? ""), req.query))
			.with(Ok(P.select()), (posts) => res.render("pages/box", { posts }))
			.otherwise(() => res.sendStatus(404)),
	)
	.get("/", (req, res) => res.render("pages/index"));
