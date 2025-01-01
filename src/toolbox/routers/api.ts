import express, { Request, Response, NextFunction } from "express";
import { match, P } from "ts-pattern";
import boxes from "../storage/boxes";
import { Option, Some } from "../../types/option";
import { getPosts } from "../operations/getPosts";
import { hashString } from "../../util";
import { createPostSchema } from "../schema/createPost";
import { parse } from "../../parse";
import { Err, Ok } from "../../types/result";
import { createPost } from "../operations/createPost";
import { deletePost } from "../operations/deletePost";
import { Failure } from "../../types/failure";
import counters from "../storage/counters";
import bodyParser from "body-parser";

const allowOrigin =
	<Params>(getOrigin: (params: Params) => Promise<Option<string>>) =>
	async (req: Request<Params>, res: Response, next: NextFunction): Promise<unknown> =>
		match(await getOrigin(req.params))
			.with(Some(P.select()), (origin) => {
				res.header("Access-Control-Allow-Origin", origin);
				res.header("Access-Control-Allow-Credentials", "true");
				res.header(
					"Access-Control-Allow-Headers",
					"Access-Control-Allow-Headers,Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers",
				);
				return next();
			})
			.otherwise(next);

export const api = express()
	.use(bodyParser.json({ type: "application/json" }))
	.all(
		"/counters/:counter",
		allowOrigin<{ counter: string }>((params) => counters.getOrigin(params.counter)),
	)
	.all(
		"/boxes/:box/*",
		allowOrigin<{ box: string }>((params) => boxes.getOrigin(params.box)),
	)
	// TODO /boxes/:box/posts/:id (has a boolean on it for if it is dead. returns true only if NOT from ip)
	// TODO /boxes/:box/posts/:id/children
	.get("/boxes/:box/posts", async (req, res) =>
		match(await getPosts(req.params.box, hashString(req.ip ?? ""), req.query))
			.with(Ok(P.select()), (posts) => res.send(posts))
			.otherwise(() => res.send(404)),
	)
	.post("/boxes/:box/posts", async (req, res) =>
		match([parse(createPostSchema, req.body), req.ip])
			.with([Ok(P.select("post")), P.string.select("ip")], async ({ ip, post }) =>
				match(await createPost(req.params.box, post, hashString(ip)))
					.with(Ok(P.select()), (post) => res.send(post))
					.with(Err(Failure.PRECONDITION_FAILED), () => res.sendStatus(412))
					.with(Err(P._), () => res.sendStatus(404))
					.exhaustive(),
			)
			.with([Err(P.select()), P._], (message) => res.send(message).status(400))
			.otherwise(() => res.sendStatus(400)),
	)
	.delete("/boxes/:box/posts/:post", async (req, res) =>
		match(req.ip)
			.with(P.string, async (ip) =>
				match(await deletePost(hashString(ip), req.params.box, req.params.post))
					.with(Ok(), () => res.sendStatus(200))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
					.with(Err(Failure.PRECONDITION_FAILED), () => res.sendStatus(412))
					.exhaustive(),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.get("/counters/:counter", async (req, res) =>
		// this is a peek
		// return counter;
		match(await counters.get(req.params.counter))
			.with(Some(P.select()), (count) => res.send(count))
			.otherwise(() => res.sendStatus(404)),
	)
	.post("/counters/:counter", async (req, res) =>
		// this is an inc
		// return ++counter;
		match(await counters.get(req.params.counter))
			.with(Some(P.select()), (count) => res.send(count))
			.otherwise(() => res.sendStatus(404)),
	)
	.get("/", (req, res) => res.send("API"));
