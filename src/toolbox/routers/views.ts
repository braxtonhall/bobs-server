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
import { getEmailPosts } from "../operations/getEmailPosts";
import { addMaintainerPayloadSchema, removeMaintainerPayloadSchema } from "../schema/maintainers";
import { subscribeSchema } from "../schema/subscribe";
import { addSubscriber } from "../operations/addSubscriber";
import { getSubscriptions } from "../operations/getSubscriptions";
import { deleteSubscription } from "../operations/deleteSubscription";
import { settingsSchema } from "../../schema";
import emails from "../storage/emails";
import { peekCounterImage, updateAndGetCounterImage } from "../operations/getCounterImage";
import countersClient from "../storage/counters";
import { createCounterSchema } from "../schema/createCounter";
import { Behaviour, editActionSchema, FontStyle, MimeType, TextAlign, TextBaseline } from "../schema/action";
import { editCounterSchema } from "../schema/editCounter";
import { fontFamilies } from "../canvas/fonts";
import slowDown from "express-slow-down";
import { allowOrigin } from "../middlewares/allowOrigin";
import counters from "../storage/counters";
import boxes from "../storage/boxes";

// TODO there is WAY too much repetition here... There must be a good way to get reuse a lot of code

const boxesViews = express()
	.all(
		"/:box/*",
		allowOrigin<{ box: string }>((params) => boxes.getOrigin(params.box)),
	)
	.get("/:box", async (req, res) =>
		match([
			// TODO use a parser that omits poorly formed queries
			await getPosts(req.params.box, hashString(req.ip ?? ""), req.query),
			await boxesClient.getStatus(req.params.box),
		])
			.with([Ok(P.select("posts")), Some(P.select("box"))], ({ posts, box }) =>
				res.render("pages/box", {
					...posts,
					box: { ...box, id: req.params.box },
					query: req.query,
					replyId: false,
					Config,
					address: res.locals.email?.address ?? "",
				}),
			)
			.otherwise(() => res.sendStatus(404)),
	)
	.post("/:box/posts", async (req, res) =>
		match([parse(createPostSchema, req.body), req.ip])
			.with([Ok(P.select("post")), P.string.select("ip")], async ({ ip, post }) =>
				match(await createPost(req.params.box, post, hashString(ip)))
					.with(Ok(P.select()), () => res.redirect(`/boxes/${req.params.box}`))
					.with(Err(Failure.PRECONDITION_FAILED), () => res.sendStatus(412))
					.with(Err(P._), () => res.sendStatus(404))
					.exhaustive(),
			)
			.with([Err(P.select()), P._], (message) => res.send(message).status(400))
			.otherwise(() => res.sendStatus(400)),
	)
	.post("/:box/posts/:id/delete", async (req, res) =>
		match(req.ip)
			.with(P.string, async (ip) =>
				match(await deletePost(hashString(ip), req.params.box, req.params.id))
					.with(Ok(), () => res.redirect(`/boxes/${req.params.box}`)) // TODO capture query params
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
					.with(Err(Failure.PRECONDITION_FAILED), () => res.sendStatus(412))
					.exhaustive(),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.post(
		"/:box/subscribe",
		slowDown({
			windowMs: 15 * 60 * 1000, // 15 minutes
			delayAfter: 5, // Allow 5 requests per 15 minutes.
			delayMs: (hits) => hits * 100, // Add 100 ms of delay to every request after the 5th one.
		}),
		async (req, res) =>
			match(parse(subscribeSchema, req.body))
				.with(Ok(P.select()), async ({ email }) =>
					match(await addSubscriber({ address: email, boxId: req.params.box }))
						.with(Ok(), () =>
							res.redirect(`/boxes/${req.params.box}?${new URLSearchParams(req.body).toString()}`),
						)
						.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
						.exhaustive(),
				)
				.otherwise(() => res.sendStatus(400)),
	);

const counterViews = express()
	.all(
		"/:counter/*",
		allowOrigin<{ counter: string }>((params) => counters.getOrigin(params.counter)),
	)
	.get("/:counter/actions/:action", async (req, res) => {
		match(
			await updateAndGetCounterImage({
				counterId: req.params.counter,
				actionId: req.params.action,
				ip: hashString(req.ip ?? ""),
			}),
		)
			.with(Some(P.select()), ({ buffer, mime }) => {
				res.writeHead(200, {
					"Content-Type": `image/${mime}`,
					"Content-Length": buffer.length,
				});
				res.end(buffer);
			})
			.otherwise(() => res.sendStatus(404));
	});

export const views = express().use("/boxes", boxesViews).use("/counters", counterViews);

const killProcedure = (dead: boolean) => async (req: Request<{ postId: string; boxId: string }>, res: Response) =>
	match(await posts.setDeadAndGetPosterId(req.params.postId, res.locals.email.id, dead))
		.with(Ok(P.select()), async (posterId) => {
			// this is a hack because prisma does not support querying based on relation
			await posters.updateKarma(posterId);
			return res.redirect(`/toolbox/boxes/admin/${req.params.boxId}`); // TODO capture query params
		})
		.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
		.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
		.exhaustive();

const deleteBoxProcedure = (deleted: boolean) => async (req: Request<{ id: string }>, res: Response) =>
	match(await boxesClient.setBoxDeletion(req.params.id, res.locals.email.id, deleted))
		.with(Ok(), () => res.redirect(`/toolbox/boxes/admin/${req.params.id}`)) // TODO capture query params
		.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
		.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
		.exhaustive();

const subscribedProcedure = (subscribed: boolean) => async (req: Request<{ id: string }>, res: Response) =>
	match(await posts.setSubscription(req.params.id, res.locals.email.id, subscribed))
		.with(Ok(P._), () => res.redirect(`/toolbox/subscriptions?${new URLSearchParams(req.body).toString()}`))
		.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
		.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
		.exhaustive();

const getBoxes = (deleted: boolean, view: string) => async (req: Request, res: Response) => {
	const { boxes, cursor } = await boxesClient.list(
		res.locals.email.id,
		deleted,
		Math.max(
			Config.MINIMUM_PAGE_SIZE,
			Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
		),
		typeof req.query.cursor === "string" ? req.query.cursor : undefined,
	);
	return res.render(view, { boxes, cursor, query: req.query, Config });
};

const boxAdminViews = express()
	.get("/create", async (req, res) => res.render("pages/toolbox/boxes/create", { Config }))
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
				Math.max(
					Config.MINIMUM_PAGE_SIZE,
					Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
				),
				typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			),
		)
			.with(Some(P.select()), async (result) =>
				res.render("pages/toolbox/boxes/admin", {
					...result,
					query: req.query,
					message: typeof req.query.message === "string" ? req.query.message : "",
					Config,
				}),
			)
			.otherwise(() => res.sendStatus(404));
	})
	.get("/admin/:id/maintainers", async (req, res) =>
		match(await boxesClient.getMaintainers({ boxId: req.params.id, userId: res.locals.email.id }))
			.with(Ok(P.select()), (permissions) =>
				res.render("pages/toolbox/boxes/maintainers", {
					boxId: req.params.id,
					Config,
					permissions,
					message: typeof req.query.message === "string" ? req.query.message : "",
				}),
			)
			.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
			.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
			.exhaustive(),
	)
	.post("/admin/:id/maintainers", (req, res) =>
		match(parse(addMaintainerPayloadSchema, req.body))
			.with(Ok(P.select()), async ({ email: address, permissions, kill, details, delete: canDelete }) =>
				match(
					await boxesClient.setMaintainer({
						userId: res.locals.email.id,
						boxId: req.params.id,
						address,
						permissions: {
							canSetPermissions: permissions,
							canSetDetails: details,
							canKill: kill,
							canDelete,
						},
					}),
				)
					.with(Ok(), () => res.redirect(`/toolbox/boxes/admin/${req.params.id}/maintainers?message=success`)) // TODO express-session here
					.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.with(Err(Failure.PRECONDITION_FAILED), () => res.sendStatus(412))
					.exhaustive(),
			)
			.otherwise(({ value }) => res.send(value).status(400)),
	)
	.post("/admin/:id/maintainers/delete", (req, res) =>
		match(parse(removeMaintainerPayloadSchema, req.body))
			.with(Ok(P.select()), async ({ email: address }) =>
				match(
					await boxesClient.removeMaintainer({
						userId: res.locals.email.id,
						boxId: req.params.id,
						address,
					}),
				)
					.with(Ok(), () => res.redirect(`/toolbox/boxes/admin/${req.params.id}/maintainers?message=success`)) // TODO express-session here
					.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.exhaustive(),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.post("/admin/:id/edit", (req, res) =>
		match(parse(editBoxSchema, req.body))
			.with(Ok(P.select()), async (payload) =>
				match(await boxesClient.edit(req.params.id, res.locals.email.id, payload))
					.with(Ok(), () => res.redirect(`/toolbox/boxes/admin/${req.params.id}?message=success`)) // TODO express-session here
					.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.exhaustive(),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.post("/admin/:id/archive", deleteBoxProcedure(true))
	.post("/admin/:id/restore", deleteBoxProcedure(false))
	.post("/admin/:boxId/posts/:postId/hide", killProcedure(true))
	.post("/admin/:boxId/posts/:postId/unhide", killProcedure(false))
	.get("/archive", getBoxes(true, "pages/toolbox/boxes/archive"))
	.get("/", getBoxes(false, "pages/toolbox/boxes/index"));

const getCounters = (deleted: boolean, view: string) => async (req: Request, res: Response) => {
	const { counters, cursor } = await countersClient.list(
		res.locals.email.id,
		deleted,
		Math.max(
			Config.MINIMUM_PAGE_SIZE,
			Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
		),
		typeof req.query.cursor === "string" ? req.query.cursor : undefined,
	);
	return res.render(view, {
		counters,
		cursor,
		query: req.query,
		Config,
	});
};

const deleteCounterProcedure = (deleted: boolean) => async (req: Request<{ id: string }>, res: Response) =>
	match(await countersClient.setDeletion({ id: req.params.id, ownerId: res.locals.email.id, deleted }))
		.with(Ok(P._), () => res.redirect(`/toolbox/counters/admin/${req.params.id}`)) // TODO capture query params
		.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
		.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
		.exhaustive();

const counterAdminViews = express()
	.get("/create", async (req, res) => res.render("pages/toolbox/counters/create", { Config }))
	.post("/create", async (req, res) =>
		match(parse(createCounterSchema, req.body))
			.with(Ok(P.select()), async ({ name, origin, unique }) => {
				const id = await countersClient.create({
					name,
					origin,
					ownerId: res.locals.email.id,
					unique,
				});
				return res.redirect(`/toolbox/counters/admin/${id}`);
			})
			.otherwise(() => res.sendStatus(400)),
	)
	.get("/admin/:id", async (req, res) =>
		match(
			await countersClient.getDetails(
				req.params.id,
				res.locals.email.id,
				Math.max(
					Config.MINIMUM_PAGE_SIZE,
					Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
				),
				typeof req.query.cursor === "string" ? req.query.cursor : undefined,
			),
		)
			.with(Some(P.select()), async ({ counter, cursor }) =>
				res.render("pages/toolbox/counters/admin", {
					query: req.query,
					counter,
					cursor,
					message: typeof req.query.message === "string" ? req.query.message : "",
					Config,
				}),
			)
			.otherwise(() => res.sendStatus(404)),
	)
	.post("/admin/:id/edit", (req, res) =>
		match(parse(editCounterSchema, req.body))
			.with(Ok(P.select()), async (payload) =>
				match(
					await countersClient.edit(req.params.id, res.locals.email.id, {
						name: payload.name,
						origin: payload.origin,
						unique: payload.unique,
						value: payload.value,
					}),
				)
					.with(Ok(P._), () => res.redirect(`/toolbox/counters/admin/${req.params.id}?message=success`))
					.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.exhaustive(),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.post("/admin/:id/archive", deleteCounterProcedure(true))
	.post("/admin/:id/restore", deleteCounterProcedure(false))
	.post("/admin/:id/actions/create", async (req, res) =>
		match(await countersClient.actions.create(req.params.id, res.locals.email.id))
			.with(Some(P.select()), ({ id, counterId }) =>
				res.redirect(`/toolbox/counters/admin/${counterId}/actions/admin/${id}`),
			)
			.otherwise(() => res.sendStatus(400)),
	)
	.get("/admin/:counterId/actions/admin/:actionId", async (req, res) =>
		match(
			await countersClient.actions.getDetails({
				ownerId: res.locals.email.id,
				counterId: req.params.counterId,
				actionId: req.params.actionId,
			}),
		)
			.with(Some(P.select()), (action) =>
				res.render("pages/toolbox/counters/action", {
					Behaviour,
					TextAlign,
					TextBaseline,
					fontFamilies,
					FontStyle,
					MimeType,
					message: typeof req.query.message === "string" ? req.query.message : "",
					action,
					Config,
				}),
			)
			.otherwise(() => res.sendStatus(404)),
	)
	.post("/admin/:counterId/actions/admin/:actionId/edit", (req, res) =>
		match(parse(editActionSchema, req.body))
			.with(Ok(P.select()), async (payload) =>
				match(
					await countersClient.actions.edit({
						counterId: req.params.counterId,
						actionId: req.params.actionId,
						ownerId: res.locals.email.id,
						payload,
					}),
				)
					.with(Ok(P._), () =>
						res.redirect(
							`/toolbox/counters/admin/${req.params.counterId}/actions/admin/${req.params.actionId}?message=success`,
						),
					) // TODO express-session here
					.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
					.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
					.exhaustive(),
			)
			.otherwise((error) => {
				console.log(error);
				res.sendStatus(400);
			}),
	)
	.post("/admin/:counterId/actions/admin/:actionId/delete", async (req, res) =>
		match(
			await countersClient.actions.delete({
				counterId: req.params.counterId,
				actionId: req.params.actionId,
				ownerId: res.locals.email.id,
			}),
		)
			.with(Ok(P._), () => res.redirect(`/toolbox/counters/admin/${req.params.counterId}?message=success`)) // TODO express-session here
			.with(Err(Failure.FORBIDDEN), () => res.sendStatus(403))
			.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
			.exhaustive(),
	)
	.get("/preview", (req, res) =>
		match(parse(editActionSchema, req.query))
			.with(Ok(P.select()), (action) => {
				const { buffer, mime } = peekCounterImage(action);
				res.writeHead(200, {
					"Content-Type": `image/${mime}`,
					"Content-Length": buffer.length,
				});
				res.end(buffer);
			})
			.otherwise(() => res.sendStatus(400)),
	)
	.get("/archive", getCounters(true, "pages/toolbox/counters/archive"))
	.get("/", getCounters(false, "pages/toolbox/counters/index"));

const postsAdminViews = express()
	.post("/posts/:id/unsubscribe", subscribedProcedure(false))
	.post("/posts/:id/subscribe", subscribedProcedure(true))
	.post("/boxes/:id/unsubscribe", async (req, res) => {
		try {
			await deleteSubscription({ boxId: req.params.id, emailId: res.locals.email.id });
			return res.redirect(`/toolbox/subscriptions?${new URLSearchParams(req.body).toString()}`);
		} catch {
			return res.sendStatus(404);
		}
	})
	.post("/email", async (req, res) => {
		try {
			const { subscribed } = settingsSchema.pick({ subscribed: true }).parse(req.body);
			await emails.updateSettings(res.locals.email.id, subscribed);
			return res.redirect(`/toolbox/subscriptions?${new URLSearchParams(req.body).toString()}`);
		} catch {
			return res.sendStatus(400);
		}
	})
	.get("/", async (req, res) => {
		const { posts, cursor } = await getEmailPosts({
			address: res.locals.email.address,
			take: Math.max(
				Config.MINIMUM_PAGE_SIZE,
				Math.min(Number(req.query.take) || Config.DEFAULT_PAGE_SIZE, Config.MAXIMUM_PAGE_SIZE),
			),
			cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
		});
		const { subscribed, subscriptions } = await getSubscriptions(res.locals.email.id);
		return res.render("pages/toolbox/boxes/subscriptions", {
			posts,
			cursor,
			query: req.query,
			Config,
			subscribed,
			boxes: subscriptions.map(({ box }) => box),
		});
	});

export const adminViews = express()
	.use("/counters", counterAdminViews)
	.use("/boxes", boxAdminViews)
	.use("/subscriptions", postsAdminViews)
	.get("/", (req, res) => res.render("pages/toolbox/index"));
