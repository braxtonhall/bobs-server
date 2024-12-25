import express from "express";
import { authenticateCookie } from "../../auth/middlewares/authenticate";
import { getViewing } from "../middlewares/checkViewing";
import { getSeries } from "../operations/getSeries";
import { getCurrentlyWatching } from "../operations/getCurrentlyWatching";
import bodyParser from "body-parser";
import { updateCursor } from "../operations/updateCursor";
import { getViewerViewTags } from "../operations/getViewerViewTags";
import { z } from "zod";
import { logEpisode, logEpisodeSchema } from "../operations/logEpisode";
import { initTRPC, TRPCError } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { getLatestEvents } from "../operations/getLatestEvents";
import { Scope } from "../types";
import { getEpisodeRelationship, getEpisodeRelationships } from "../operations/getEpisodeRelationships";
import { getEpisode } from "../operations/getEpisode";
import { getWatchlist } from "../operations/getWatchlist";
import { updateWatchlist, updateWatchlistInputSchema } from "../operations/updateWatchlist";
import { getViewer } from "../operations/getViewer";
import * as viewing from "../operations/viewing";
import { getSettings } from "../operations/getSettings";
import { episodeQuerySchema, settingsPayloadSchema, updateSelfPayloadSchema } from "../schemas";
import { setSettings } from "../operations/setSettings";
import { getWatchlists } from "../operations/getWatchlists";
import { getViewerRatings } from "../operations/getViewerRatings";
import { getWatchlistRelationship } from "../operations/getWatchlistRelationship";
import { getWatchlistTags } from "../operations/getWatchlistTags";
import { getWatchlistViewings } from "../operations/getWatchlistViewings";
import { setSelf } from "../operations/setSelf";
import { setWatchlistLiked } from "../operations/setWatchlistLiked";
import { authorize, deauthenticate, login } from "../../auth/operations";
import { Duration } from "luxon";
import Config from "../../Config";
import cookieParser from "cookie-parser";

const tokenMaxAge = Duration.fromObject({ hour: Config.API_TOKEN_EXPIRATION_HOURS }).toMillis();

export const t = initTRPC.context<Context>().create();

const createContext = ({ res }: trpcExpress.CreateExpressContextOptions) => ({
	setCookie: (env: { key: string; value: string; maxAge: number }) =>
		res.cookie(env.key, env.value, { sameSite: "none", secure: true, maxAge: env.maxAge }),
	clearCookie: (key: string) => res.clearCookie(key),
	token: res.locals.token as string | undefined,
	emailId: (res.locals.email?.id ?? undefined) as string | undefined,
	viewerId: (res.locals.viewer?.id ?? undefined) as string | undefined,
});
type Context = Awaited<ReturnType<typeof createContext>>;

const publicProcedure = t.procedure;

const authedProcedure = t.procedure.use(async ({ ctx: { emailId, viewerId }, next }) => {
	if (!emailId) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	if (!viewerId) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}

	return next({ ctx: { viewerId, emailId } });
});

const trekRouter = t.router({
	getSeries: publicProcedure.query(getSeries),
	getViewerViewTags: authedProcedure.query(({ ctx }) => getViewerViewTags(ctx.viewerId)),
	getCurrentlyWatching: authedProcedure
		.input(z.string().optional())
		.query(({ input: cursor, ctx }) => getCurrentlyWatching(ctx.viewerId, cursor)),
	updateCursor: authedProcedure
		.input(z.object({ viewingId: z.string(), episodeId: z.string().or(z.null()) }))
		.mutation(({ input: { viewingId, episodeId }, ctx: { viewerId } }) =>
			updateCursor({ viewerId, episodeId, viewingId }),
		),
	getWatchlist: publicProcedure
		.input(z.string())
		.query(({ ctx: { viewerId }, input: watchlistId }) => getWatchlist({ viewerId, watchlistId })),
	getWatchlistTags: publicProcedure
		.input(z.object({ watchlistId: z.string(), cursor: z.string().optional() }))
		.query(({ input }) => getWatchlistTags(input)),
	getWatchlistViewings: authedProcedure
		.input(z.object({ watchlistId: z.string(), cursor: z.string().optional() }))
		.query(({ ctx: { viewerId }, input: { watchlistId, cursor } }) =>
			getWatchlistViewings({
				viewerId,
				watchlistId,
				cursor,
			}),
		),
	getWatchlistRelationship: authedProcedure
		.input(z.string())
		.query(({ ctx: { viewerId }, input: watchlistId }) => getWatchlistRelationship({ viewerId, watchlistId })),
	setWatchlistLiked: authedProcedure
		.input(z.object({ watchlistId: z.string(), liked: z.boolean() }))
		.mutation(({ ctx: { viewerId }, input: { watchlistId, liked } }) =>
			setWatchlistLiked({ viewerId, watchlistId, liked }),
		),
	startViewing: authedProcedure
		.input(z.string())
		.mutation(({ ctx: { viewerId }, input: watchlistId }) => viewing.start({ viewerId, watchlistId })),
	pauseViewing: authedProcedure
		.input(z.string())
		.mutation(({ ctx: { viewerId }, input: viewingId }) => viewing.pause({ viewerId, viewingId })),
	stopViewing: authedProcedure
		.input(z.string())
		.mutation(({ ctx: { viewerId }, input: viewingId }) => viewing.stop({ viewerId, viewingId })),
	resumeViewing: authedProcedure
		.input(z.string())
		.mutation(({ ctx: { viewerId }, input: viewingId }) => viewing.resume({ viewerId, viewingId })),
	completeViewing: authedProcedure
		.input(z.string())
		.mutation(({ ctx: { viewerId }, input: viewingId }) => viewing.complete({ viewerId, viewingId })),
	getEpisodeRelationships: publicProcedure.query(({ ctx: { viewerId } }) => getEpisodeRelationships(viewerId)),
	getEpisodeRelationship: publicProcedure
		.input(episodeQuerySchema)
		.query(({ ctx: { viewerId }, input: { season, show, episode } }) =>
			getEpisodeRelationship({ seriesId: show, season, production: episode, viewerId }),
		),
	getEpisode: publicProcedure
		.input(episodeQuerySchema)
		.query(({ input: { season, show, episode } }) => getEpisode({ seriesId: show, season, production: episode })),
	getSeason: publicProcedure.input(z.object({ season: z.number(), show: z.string() })).query(
		({ ctx: { viewerId }, input: { season, show } }) => `TODO ${viewerId} ${show} ${season}`, // TODO
	),
	getShow: publicProcedure
		.input(z.object({ show: z.string() }))
		.query(({ ctx: { viewerId }, input: { show } }) => `TODO ${viewerId} ${show}`), // TODO
	getViewer: publicProcedure
		.input(z.string())
		.query(({ ctx: { viewerId }, input: targetId }) => getViewer({ requestorId: viewerId, targetId })),
	getViewerRatings: publicProcedure.input(z.string()).query(({ input: viewerId }) => getViewerRatings(viewerId)),
	getSelf: authedProcedure.query(async ({ ctx: { viewerId } }) => ({
		...(await getViewer({ requestorId: viewerId, targetId: viewerId }))!,
		settings: await getSettings(viewerId),
	})),
	setSelf: authedProcedure
		.input(updateSelfPayloadSchema)
		.mutation(({ ctx: { viewerId }, input: { name, about } }) => setSelf({ viewerId, name, about })),
	getWatchlists: publicProcedure
		.input(z.object({ viewerId: z.string(), cursor: z.string().optional() }))
		.query(({ ctx: { viewerId: requestorId }, input: { viewerId: targetId, cursor } }) =>
			getWatchlists({ requestorId, targetId, cursor }),
		),
	setSettings: authedProcedure
		.input(settingsPayloadSchema)
		.mutation(({ ctx: { viewerId }, input: settings }) => setSettings({ viewerId, settings })),
	updateWatchlist: authedProcedure
		.input(updateWatchlistInputSchema)
		.mutation(({ ctx, input }) => updateWatchlist(ctx.viewerId, input)),
	logEpisode: authedProcedure.input(logEpisodeSchema).mutation(({ input, ctx }) => logEpisode(ctx.viewerId, input)),
	getAllEvents: publicProcedure
		.input(z.number().optional())
		.query(({ input: cursor }) => getLatestEvents({ cursor, scope: Scope.EVERYONE })),
	getFollowingEvents: authedProcedure
		.input(z.number().optional())
		.query(({ input: cursor, ctx: { viewerId } }) => getLatestEvents({ cursor, viewerId, scope: Scope.FOLLOWING })),
	getIndividualEvents: publicProcedure
		.input(
			z.object({
				cursor: z.number().optional(),
				viewerId: z.string(),
			}),
		)
		.query(({ input: { cursor, viewerId } }) => getLatestEvents({ cursor, viewerId, scope: Scope.INDIVIDUAL })),
	startLogin: publicProcedure
		.input(
			z.object({
				email: z.string(),
				next: z.string(),
			}),
		)
		.mutation(({ input: { email, next } }) => login({ email, next })),
	completeLogin: publicProcedure
		.input(
			z.object({
				email: z.string(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input: { email, password }, ctx: { setCookie } }) => {
			try {
				const token = await authorize({ email, temporaryToken: password });
				setCookie({ key: "token", value: token, maxAge: tokenMaxAge });
			} catch {
				throw new TRPCError({ code: "BAD_REQUEST" });
			}
		}),
	logout: authedProcedure.mutation(async ({ ctx: { token, clearCookie } }) => {
		token && (await deauthenticate(token).catch(() => {}));
		clearCookie("token");
	}),
});

export type TrekRouter = typeof trekRouter;

export const api = express()
	.post("/*", bodyParser.urlencoded({ extended: true }))
	.use(cookieParser())
	.use(authenticateCookie)
	.use(getViewing)
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
