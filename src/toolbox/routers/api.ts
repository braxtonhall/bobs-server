import express, { NextFunction, Request, Response } from "express";
import { match, P } from "ts-pattern";
import boxes from "../storage/boxes.js";
import { Option, Some } from "../../types/option.js";
import { getPosts } from "../operations/getPosts.js";
import { hashString } from "../../util.js";
import { createPostSchema } from "../schema/createPost.js";
import { parse } from "../../parse.js";
import { Err, Ok } from "../../types/result.js";
import { createPost } from "../operations/createPost.js";
import { deletePost } from "../operations/deletePost.js";
import { Failure } from "../../types/failure.js";
import counters from "../storage/counters.js";
import bodyParser from "body-parser";
import slowDown from "express-slow-down";
import { Behaviour } from "../schema/action.js";

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
			.otherwise(() => next());

const limiter = slowDown({
	windowMs: 15 * 60 * 1000, // 15 minutes
	delayAfter: 5, // Allow 5 requests per 15 minutes.
	delayMs: (hits) => hits * 100, // Add 100 ms of delay to every request after the 5th one.
});

const boxesApi = express()
	.all(
		"/:box/*",
		allowOrigin<{ box: string }>((params) => boxes.getOrigin(params.box)),
	)
	// TODO /boxes/:box/posts/:id (has a boolean on it for if it is dead. returns true only if NOT from ip)
	// TODO /boxes/:box/posts/:id/children
	.get("/:box/posts", async (req, res) =>
		match(await getPosts(req.params.box, hashString(req.ip ?? ""), req.query))
			.with(Ok(P.select()), (posts) => res.send(posts))
			.otherwise(() => res.send(404)),
	)
	.post("/:box/posts", async (req, res) =>
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
	.delete("/:box/posts/:post", async (req, res) =>
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
	);

const act = (behaviour: Behaviour) => async (req: Request, res: Response) =>
	match(
		await counters.actions.act(
			{ id: req.params.action, behaviour, counter: { id: req.params.counter } },
			hashString(req.ip ?? ""),
		),
	)
		.with(Some(P.select()), ({ value }) => res.send({ value }))
		.otherwise(() => res.sendStatus(404));

const countersApi = express()
	.all(
		"/:counter/*",
		limiter,
		allowOrigin<{ counter: string }>((params) => counters.getOrigin(params.counter)),
	)
	.get("/:counter/actions/:action", act(Behaviour.NOOP))
	.put("/:counter/actions/:action", act(Behaviour.SET))
	.post("/:counter/actions/:action", act(Behaviour.INC));

export const api = express()
	.use(bodyParser.json({ type: "application/json" }))
	.use("/boxes", boxesApi)
	.use("/counters", countersApi)
	.get("/", (req, res) => res.send("API"));
