import express from "express";
import { authenticateHeader } from "../../auth/middlewares/authenticate";
import { getViewing } from "../middlewares/checkViewing";
import { getSeries } from "../operations/getSeries";
import { getCurrentlyWatching } from "../operations/getCurrentlyWatching";
import bodyParser from "body-parser";
import { updateCursor } from "../operations/updateCursor";
import { getViewerViewTags } from "../operations/getViewerViewTags";
import { z } from "zod";
import { logEpisode, logEpisodeSchema } from "../operations/logEpisode";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { getLatestEvents } from "../operations/getLatestEvents";
import { Scope } from "../types";
import { getEpisodes } from "../operations/getEpisodes";
import { getEpisode } from "../operations/getEpisode";
import { getWatchlist } from "../operations/getWatchlist";
import { updateWatchlist, updateWatchlistInputSchema } from "../operations/updateWatchlist";
import { getViewer } from "../operations/getViewer";
import { startWatching } from "../operations/startWatching";
import { getSettings } from "../operations/getSettings";
import { settingsPayloadSchema, updateSelfPayloadSchema } from "../schemas";
import { setSettings } from "../operations/setSettings";
import { getWatchlists } from "../operations/getWatchlists";
import { getViewerRatings } from "../operations/getViewerRatings";
import { getWatchlistRelationship } from "../operations/getWatchlistRelationship";
import { getWatchlistTags } from "../operations/getWatchlistTags";
import { getWatchlistViewings } from "../operations/getWatchlistViewings";
import { setSelf } from "../operations/setSelf";

export const t = initTRPC.context<Context>().create();

const createContext = ({ res }: trpcExpress.CreateExpressContextOptions) => ({
	viewerId: res.locals.viewer.id as string,
});
type Context = Awaited<ReturnType<typeof createContext>>;

const trekRouter = t.router({
	getSeries: t.procedure.query(getSeries),
	getViewerViewTags: t.procedure.query(({ ctx }) => getViewerViewTags(ctx.viewerId)),
	getCurrentlyWatching: t.procedure
		.input(z.string().optional())
		.query(({ input: cursor, ctx }) => getCurrentlyWatching(ctx.viewerId, cursor)),
	updateCursor: t.procedure
		.input(z.object({ viewingId: z.string(), episodeId: z.string().or(z.null()) }))
		.mutation(({ input: { viewingId, episodeId }, ctx: { viewerId } }) =>
			updateCursor({ viewerId, episodeId, viewingId }),
		),
	getWatchlist: t.procedure
		.input(z.string())
		.query(({ ctx: { viewerId }, input: watchlistId }) => getWatchlist({ viewerId, watchlistId })),
	getWatchlistTags: t.procedure
		.input(z.object({ watchlistId: z.string(), cursor: z.string().optional() }))
		.query(({ input }) => getWatchlistTags(input)),
	getWatchlistViewings: t.procedure
		.input(z.object({ watchlistId: z.string(), cursor: z.string().optional() }))
		.query(({ ctx: { viewerId }, input: { watchlistId, cursor } }) =>
			getWatchlistViewings({
				viewerId,
				watchlistId,
				cursor,
			}),
		),
	getWatchlistRelationship: t.procedure
		.input(z.string())
		.query(({ ctx: { viewerId }, input: watchlistId }) => getWatchlistRelationship({ viewerId, watchlistId })),
	startWatching: t.procedure
		.input(z.string())
		.mutation(({ ctx: { viewerId }, input: watchlistId }) => startWatching({ viewerId, watchlistId })),
	getEpisodes: t.procedure.query(({ ctx: { viewerId } }) => getEpisodes(viewerId)),
	getEpisode: t.procedure
		.input(z.object({ season: z.number(), show: z.string(), episode: z.number() }))
		.query(({ ctx: { viewerId }, input: { season, show, episode } }) =>
			getEpisode({ viewerId, seriesId: show, season, production: episode }),
		),
	getSeason: t.procedure.input(z.object({ season: z.number(), show: z.string() })).query(
		({ ctx: { viewerId }, input: { season, show } }) => `TODO ${viewerId} ${show} ${season}`, // TODO
	),
	getShow: t.procedure
		.input(z.object({ show: z.string() }))
		.query(({ ctx: { viewerId }, input: { show } }) => `TODO ${viewerId} ${show}`), // TODO
	getViewer: t.procedure
		.input(z.string())
		.query(({ ctx: { viewerId }, input: targetId }) => getViewer({ requestorId: viewerId, targetId })),
	getViewerRatings: t.procedure.input(z.string()).query(({ input: viewerId }) => getViewerRatings(viewerId)),
	getSelf: t.procedure.query(async ({ ctx: { viewerId } }) => ({
		...(await getViewer({ requestorId: viewerId, targetId: viewerId }))!,
		settings: await getSettings(viewerId),
	})),
	setSelf: t.procedure
		.input(updateSelfPayloadSchema)
		.mutation(({ ctx: { viewerId }, input: { name, about } }) => setSelf({ viewerId, name, about })),
	getWatchlists: t.procedure
		.input(z.object({ viewerId: z.string(), cursor: z.string().optional() }))
		.query(({ ctx: { viewerId: requestorId }, input: { viewerId: targetId, cursor } }) =>
			getWatchlists({ requestorId, targetId, cursor }),
		),
	setSettings: t.procedure
		.input(settingsPayloadSchema)
		.mutation(({ ctx: { viewerId }, input: settings }) => setSettings({ viewerId, settings })),
	updateWatchlist: t.procedure
		.input(updateWatchlistInputSchema)
		.mutation(({ ctx, input }) => updateWatchlist(ctx.viewerId, input)),
	logEpisode: t.procedure.input(logEpisodeSchema).mutation(({ input, ctx }) => logEpisode(ctx.viewerId, input)),
	getAllEvents: t.procedure
		.input(z.number().optional())
		.query(({ input: cursor, ctx: { viewerId } }) => getLatestEvents({ cursor, viewerId, scope: Scope.EVERYONE })),
	getFollowingEvents: t.procedure
		.input(z.number().optional())
		.query(({ input: cursor, ctx: { viewerId } }) => getLatestEvents({ cursor, viewerId, scope: Scope.FOLLOWING })),
	getIndividualEvents: t.procedure
		.input(
			z.object({
				cursor: z.number().optional(),
				viewerId: z.string(),
			}),
		)
		.query(({ input: { cursor, viewerId } }) => getLatestEvents({ cursor, viewerId, scope: Scope.INDIVIDUAL })),
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
