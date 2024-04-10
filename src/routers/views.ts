import express from "express";
import { getPosts } from "../operations/getPosts";
import { hashString } from "../util";
import { match, P } from "ts-pattern";
import { Err, Ok } from "../types/result";
import bodyParser from "body-parser";
import { parse } from "../schema/parse";
import { createPostSchema } from "../schema/createPost";
import { createPost } from "../operations/createPost";
import { deletePost } from "../operations/deletePost";
import { Failure } from "../types/failure";
import boxes from "../storage/boxes";
import { Some } from "../types/option";

// TODO there is WAY too much repetition here... There must be a good way to get reuse a lot of code

export const views = express()
	.set("view engine", "ejs")
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.get("/boxes/:box/posts", async (req, res) =>
		match([await getPosts(req.params.box, hashString(req.ip ?? ""), req.query), await boxes.get(req.params.box)])
			.with([Ok(P.select("post")), Some(P.select("box"))], ({ post, box }) =>
				res.render("pages/box", { ...post, box, query: req.query }),
			)
			.otherwise(() => res.sendStatus(404)),
	)
	.post("/boxes/:box/posts", async (req, res) =>
		match([parse(createPostSchema, req.body), req.ip])
			.with([Ok(P.select("post")), P.string.select("ip")], async ({ ip, post }) =>
				match(await createPost(req.params.box, post, hashString(ip)))
					.with(Ok(P.select()), () => res.redirect(`/boxes/${req.params.box}/posts`))
					.with(Err(P._), () => res.sendStatus(404))
					.exhaustive(),
			)
			.with([Err(P.select()), P._], (message) => res.send(message).status(400))
			.otherwise(() => res.sendStatus(400)),
	)
	.post("/boxes/:box/posts/delete", async (req, res) =>
		match([req.ip, req.body.id])
			.with([P.string, P.string], async ([ip, id]) =>
				match(await deletePost(hashString(ip), req.params.box, id))
					.with(Ok(), () => res.redirect(`/boxes/${req.params.box}/posts`))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.with(Err(Failure.UNAUTHORIZED), () => res.sendStatus(401))
					.with(Err(Failure.PRECONDITION_FAILED), () => res.sendStatus(412))
					.exhaustive(),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.get("/", (req, res) => res.render("pages/index"));
