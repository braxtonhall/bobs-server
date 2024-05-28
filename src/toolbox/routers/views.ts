import express, { Request, Response } from "express";
import { getPosts } from "../operations/getPosts";
import { hashString } from "../../util";
import { match, P } from "ts-pattern";
import { Err, Ok } from "../../types/result";
import { parse } from "../../parse";
import { createPostSchema } from "../schema/createPost";
import { createPost } from "../operations/createPost";
import { deletePost } from "../operations/deletePost";
import { Failure } from "../../types/failure";
import boxesClient from "../storage/boxes";
import { Some } from "../../types/option";
import Config from "../../Config";
import { createBoxSchema } from "../schema/createBox";
import { editBoxSchema } from "../schema/editBox";
import posts from "../storage/posts";
import posters from "../storage/posters";

// TODO there is WAY too much repetition here... There must be a good way to get reuse a lot of code

// TODO these will probably all be embeds

export const views = express()
	.get("/boxes/:box/posts", async (req, res) =>
		match([
			await getPosts(req.params.box, hashString(req.ip ?? ""), req.query),
			await boxesClient.getStatus(req.params.box),
		])
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
					.with(Err(Failure.PRECONDITION_FAILED), () => res.sendStatus(412))
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
	);

const killProcedure = (dead: boolean) => async (req: Request<{ postId: string; boxId: string }>, res: Response) =>
	match(await posts.setDeadAndGetPosterId(req.params.postId, res.locals.email.id, dead))
		.with(Ok(P.select()), async (posterId) => {
			// this is a hack because prisma does not support querying based on relation
			await posters.updateKarma(posterId);
			return res.redirect(`/toolbox/boxes/admin/${req.params.boxId}`);
		})
		.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
		.with(Err(Failure.UNAUTHORIZED), () => res.sendStatus(401))
		.exhaustive();

const deleteProcedure = (deleted: boolean) => async (req: Request<{ id: string }>, res: Response) =>
	match(await boxesClient.setBoxDeletion(req.params.id, res.locals.email.id, deleted))
		.with(Ok(P._), () => res.redirect(`/toolbox/boxes/admin/${req.params.id}`))
		.with(Err(Failure.UNAUTHORIZED), () => res.sendStatus(401))
		.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
		.exhaustive();

const boxAdminViews = express()
	.get("/create", async (req, res) => res.render("pages/toolbox/boxes/create"))
	.post("/create", async (req, res) =>
		match(parse(createBoxSchema, req.body))
			.with(Ok(P.select()), async ({ name, origin }) => {
				const id = await boxesClient.create({
					name,
					origin,
					ownerId: res.locals.email.id,
				});
				return res.redirect(`/toolbox/boxes/admin/${id}`);
			})
			.otherwise(() => res.sendStatus(400)),
	)
	.get("/admin/:id", async (req, res) => {
		return match(
			await boxesClient.getDetails(
				req.params.id,
				res.locals.email.id,
				Math.max(1, Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE)),
				typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			),
		)
			.with(Some(P.select()), async (result) =>
				res.render("pages/toolbox/boxes/admin", {
					...result,
					query: req.query,
					message: typeof req.query.message === "string" ? req.query.message : "",
				}),
			)
			.otherwise(() => res.sendStatus(404));
	})
	.post("/admin/:id/edit", (req, res) =>
		match(parse(editBoxSchema, req.body))
			.with(Ok(P.select()), async (payload) =>
				match(await boxesClient.edit(req.params.id, res.locals.email.id, payload))
					.with(Ok(), () => res.redirect(`/toolbox/boxes/admin/${req.params.id}?message=success`))
					.with(Err(Failure.UNAUTHORIZED), () => res.sendStatus(401))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.exhaustive(),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.post("/admin/:id/archive", deleteProcedure(true))
	.post("/admin/:id/restore", deleteProcedure(false))
	.post("/admin/:boxId/posts/:postId/hide", killProcedure(true))
	.post("/admin/:boxId/posts/:postId/unhide", killProcedure(false))
	.get("/archive", async (req, res) => {
		const { boxes, cursor } = await boxesClient.list(
			res.locals.email.id,
			true,
			Math.max(1, Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE)),
			typeof req.query.cursor === "string" ? req.query.cursor : undefined,
		);
		return res.render("pages/toolbox/boxes/archive", { boxes, cursor, query: req.query });
	})
	.get("/", async (req, res) => {
		const { boxes, cursor } = await boxesClient.list(
			res.locals.email.id,
			false,
			Math.max(1, Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE)),
			typeof req.query.cursor === "string" ? req.query.cursor : undefined,
		);
		return res.render("pages/toolbox/boxes/index", { boxes, cursor, query: req.query });
	});

const counterAdminViews = express().get("/", (req, res) => res.render("pages/toolbox/counters/index"));

export const adminViews = express()
	.use("/counters", counterAdminViews)
	.use("/boxes", boxAdminViews)
	.get("/", (req, res) => res.render("pages/toolbox/index"));
