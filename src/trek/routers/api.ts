import express from "express";
import { authenticateHeader } from "../../auth/middlewares/authenticate";
import { getViewing } from "../middlewares/checkViewing";
import { getSeries } from "../operations/getSeries";
import { getCurrentlyWatching } from "../operations/getCurrentlyWatching";
import bodyParser from "body-parser";
import { updateCursor } from "../operations/updateCursor";
import { getViewerTags } from "../operations/getViewerTags";
import { z } from "zod";
import { logEpisode, logEpisodeSchema } from "../operations/logEpisode";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { getLatestEvents } from "../operations/getLatestEvents";
import { Scope } from "../types";

export const t = initTRPC.context<Context>().create();

const createContext = ({ res }: trpcExpress.CreateExpressContextOptions) => ({
	viewerId: res.locals.viewer.id as string,
});
type Context = Awaited<ReturnType<typeof createContext>>;

const trekRouter = t.router({
	getSeries: t.procedure.query(getSeries),
	getViewerTags: t.procedure.query(({ ctx }) => getViewerTags(ctx.viewerId)),
	getCurrentlyWatching: t.procedure
		.input(z.string().optional())
		.query(({ input: cursor, ctx }) => getCurrentlyWatching(ctx.viewerId, cursor)),
	updateCursor: t.procedure
		.input(z.object({ viewingId: z.string(), episodeId: z.string().or(z.null()) }))
		.mutation(({ input: { viewingId, episodeId }, ctx: { viewerId } }) =>
			updateCursor({ viewerId, episodeId, viewingId }),
		),
	logEpisode: t.procedure.input(logEpisodeSchema).mutation(({ input, ctx }) => logEpisode(ctx.viewerId, input)),
	getEvents: t.procedure
		.input(
			z.object({
				cursor: z.number().optional(),
				scope: z.nativeEnum(Scope),
			}),
		)
		.query(({ input: { cursor, scope }, ctx: { viewerId } }) => getLatestEvents({ cursor, viewerId, scope })),
});

export type TrekRouter = typeof trekRouter;

export const api = express()
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.use(authenticateHeader)
	.use(getViewing)
	.use((req, res, next) => {
		// TODO migrate this ... https://trpc.io/docs/server/procedures
		//  getViewing should really just be part of createContext,
		//  and this function should get rolled into t.procedure.use(..)
		if (!res.locals.logged) {
			return res.sendStatus(403);
		} else if (!res.locals.viewing) {
			return res.sendStatus(401);
		} else {
			return next();
		}
	})
	.use(
		"/trpc",
		trpcExpress.createExpressMiddleware({
			router: trekRouter,
			createContext,
		}),
	);
// TODO
//  on WATCHING page, there are two buttons: skip, watched on. both update your watchlist pointer
//  on EPISODE page, there are two buttons: seen, watched on. seen never updates your pointer. watched on
//   does iff it's the episode you are currently watching
