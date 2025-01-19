import express, { Request, Response, NextFunction } from "express";
import { match, P } from "ts-pattern";
import boxes from "../storage/boxes";
import { Option, Some } from "../../types/option";
import { getPosts } from "../operations/getPosts";
import { hashString } from "../../util";
import { createPostSchema } from "../schema/createPost";
import { putCounterValue } from "../schema/putCounterValue";
import { parse } from "../../parse";
import { Err, Ok } from "../../types/result";
import { createPost } from "../operations/createPost";
import { deletePost } from "../operations/deletePost";
import { Failure } from "../../types/failure";
import counters from "../storage/counters";
import bodyParser from "body-parser";
import slowDown from "express-slow-down";

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

const countersApi = express()
	.all(
		"/:counter/*",
		limiter,
		allowOrigin<{ counter: string }>((params) => counters.getOrigin(params.counter)),
	)
	.get("/:counter", async (req, res) =>
		// this is a peek
		// return counter;
		match(await counters.get({ id: req.params.counter, allowApiGet: true }))
			.with(Some(P.select()), (value) => res.send(value))
			.otherwise(() => res.sendStatus(404)),
	)
	.put("/:counter", async (req, res) => {
		try {
			const { value } = putCounterValue.parse(req.body);
			return match(await counters.set({ id: req.params.counter, allowApiSet: true }, value))
				.with(Some(P.select()), (value) => res.send(value))
				.otherwise(() => res.sendStatus(404));
		} catch {
			return res.sendStatus(400);
		}
	})
	.post("/:counter/inc", async (req, res) =>
		// this is an inc
		// return ++counter;
		match(await counters.increment({ id: req.params.counter, allowApiInc: true }, hashString(req.ip ?? "")))
			.with(Some(P.select()), (count) => res.send({ count }))
			.otherwise(() => res.sendStatus(404)),
	);

export const api = express()
	.use(bodyParser.json({ type: "application/json" }))
	.use("/boxes", boxesApi)
	.use("/counters", countersApi)
	.get("/", (req, res) => res.send("API"));
