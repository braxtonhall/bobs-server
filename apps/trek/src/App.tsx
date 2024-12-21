import { createBrowserRouter, Outlet, redirect, RouterProvider } from "react-router-dom";
import Watch from "./components/Watch";
import Episode from "./components/Episode";
import Watchlist from "./components/Watchlist";
import { Window } from "./components/Window";
import { api } from "./util/api";
import { z } from "zod";
import { Explore } from "./components/Explore";
import Activity from "./components/Activity";
import { Profile } from "./components/Profile";
import { Watchlists } from "./components/Profile/Watchlists";
import React, { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Reviews } from "./components/Profile/Reviews";
import { Tags } from "./components/Profile/Tags";
import { Stats } from "./components/Profile/Stats";
import { Likes } from "./components/Profile/Likes";
import { Diary } from "./components/Profile/Diary";
import { Followers } from "./components/Profile/Followers";
import { Following } from "./components/Profile/Following";
import { Settings } from "./components/Settings";
import { ProfileContextProvider } from "./contexts/ProfileContext";
import WatchlistOld from "./components/WatchlistOld";
import { TRPCClientError } from "@trpc/client";
import { Login } from "./components/Login";

const publicLoader = async () => {
	try {
		return await api.getSelf.query();
	} catch (error) {
		return {
			viewer: null,
			self: false,
			settings: null,
		};
	}
};

const authedLoader = async () => {
	try {
		// TODO This should be checking if there's something in storage first
		return await api.getSelf.query();
	} catch (error) {
		if (error instanceof TRPCClientError) {
			if (error.message === "UNAUTHORIZED") {
				// TODO i don't wanna redirect....
				//   i want the page to be the login page!
				// return redirect("/login");
			} else if (error.message === "FORBIDDEN") {
				// return redirect("/signup");
			}
		}
		throw error;
	}
};

const router = createBrowserRouter(
	[
		{
			path: "/",
			// TODO need to supply some platform settings
			// TODO if not logged in, get a 401. The 401 error handler should give login page!
			element: (
				<Window>
					<Outlet />
				</Window>
			),
			loader: publicLoader,
			id: "root",
			// action: rootAction,
			children: [
				{
					path: "/",
					loader: authedLoader,
					element: <Watch />,
					// TODO need to repeat a layer of this for signup as well
					errorElement: <Login />,
				},
				{
					path: "/explore",
					element: <Explore />,
				},
				{
					path: "/activity",
					element: <Activity />,
				},
				{
					path: "/viewers/:id",
					id: "viewer",
					loader: async ({ params: { id } }) => {
						const viewer = await api.getViewer.query(id ?? "");
						if (viewer) {
							return viewer;
						} else {
							throw new Response("Not Found", { status: 404 });
						}
					},
					element: (
						<ProfileContextProvider>
							<Outlet />
						</ProfileContextProvider>
					),
					children: [
						{
							path: "/viewers/:id",
							element: <Profile />,
						},
						{
							path: "/viewers/:id/watchlists",
							element: <Watchlists />,
						},
						{
							path: "/viewers/:id/reviews",
							element: <Reviews />,
						},
						{
							path: "/viewers/:id/likes",
							element: <Likes />,
						},
						{
							path: "/viewers/:id/tags",
							element: <Tags />,
						},
						{
							path: "/viewers/:id/stats",
							element: <Stats />,
						},
						{
							path: "/viewers/:id/diary",
							element: <Diary />,
						},
						{
							path: "/viewers/:id/followers",
							element: <Followers />,
						},
						{
							path: "/viewers/:id/following",
							element: <Following />,
						},
					],
				},
				{
					path: "/shows/:show",
					element: <>SHOW</>,
					loader: async ({ params }) => {
						try {
							const show = await api.getShow.query(
								z.object({ show: z.string().toUpperCase() }).parse(params),
							);
							if (show) {
								return show;
							}
						} catch {}
						throw new Response("Not Found", { status: 404 });
					},
				},
				{
					path: "/shows/:show/seasons/:season",
					element: <>SEASON</>,
					loader: async ({ params }) => {
						try {
							const episode = await api.getSeason.query(
								z
									.object({
										season: z.coerce.number(),
										show: z.string().toUpperCase(),
									})
									.parse(params),
							);
							if (episode) {
								return episode;
							}
						} catch {}
						throw new Response("Not Found", { status: 404 });
					},
				},
				{
					path: "/shows/:show/seasons/:season/episodes/:episode",
					element: <Episode />,
					loader: async ({ params }) => {
						try {
							const input = z
								.object({
									season: z.coerce.number(),
									show: z.string().toUpperCase(),
									episode: z.coerce.number(),
								})
								.parse(params);
							const [episode, relationship] = await Promise.all([
								api.getEpisode.query(input),
								api.getEpisodeRelationship.query(input),
							]);
							if (episode && relationship) {
								return { episode, relationship };
							}
						} catch {}
						throw new Response("Not Found", { status: 404 });
					},
				},
				{
					path: "/watchlists/:id",
					element: <Watchlist />,
					loader: async ({ params: { id } }) => {
						const watchlist = await api.getWatchlist.query(id ?? "");
						if (watchlist) {
							return watchlist;
						} else {
							throw new Response("Not Found", { status: 404 });
						}
					},
				},
				{
					path: "/watchlists/:id/edit",
					element: <WatchlistOld />,
					loader: async ({ params: { id } }) => {
						const watchlist = await api.getWatchlist.query(id ?? "");
						if (watchlist && watchlist.owner) {
							return watchlist;
						} else {
							throw new Response("Not Found", { status: 404 });
						}
					},
				},
			],
		},
		{
			path: "/signup",
			loader: async () => {
				try {
					await api.getSelf.query();
					return redirect("/");
				} catch (error) {
					if (error instanceof TRPCClientError) {
						if (error.message === "UNAUTHORIZED") {
							return redirect("/login");
						} else if (error.message === "FORBIDDEN") {
							return {
								viewer: null,
								self: false,
								settings: null,
							};
						}
					}
					throw error;
				}
			},
			element: (
				<Window>
					<></>
				</Window>
			),
		},
		{
			path: "/login",
			loader: async () => {
				try {
					await api.getSelf.query();
					return redirect("/");
				} catch (error) {
					if (error instanceof TRPCClientError) {
						if (error.message === "UNAUTHORIZED") {
							return {
								viewer: null,
								self: false,
								settings: null,
							};
						} else if (error.message === "FORBIDDEN") {
							return redirect("/signup");
						}
					}
					throw error;
				}
			},
			element: (
				<Window>
					<Login />
				</Window>
			),
		},
		{
			path: "/settings",
			loader: authedLoader,
			element: (
				<Window>
					<ProfileContextProvider>
						<Settings />
					</ProfileContextProvider>
				</Window>
			),
		},
	],
	{ basename: process.env.PUBLIC_URL },
);

const App = () => (
	<QueryClientProvider client={useMemo(() => new QueryClient(), [])}>
		<RouterProvider router={router} />
	</QueryClientProvider>
);

export default App;
