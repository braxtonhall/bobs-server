import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
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
import Settings from "./components/Settings";
import { ProfileContextProvider } from "./contexts/ProfileContext";

const router = createBrowserRouter(
	[
		{
			path: "/",
			// TODO need to supply some platform settings
			// TODO if not logged in, get a 401. The 401 error handler should give login page!
			element: <Window />,
			loader: () => api.getSelf.query(),
			id: "root",
			// errorElement: <ErrorPage />,
			// action: rootAction,
			children: [
				{
					path: "/",
					element: <Watch />,
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
					path: "/settings",
					element: (
						<ProfileContextProvider loaderId="root">
							<Settings />
						</ProfileContextProvider>
					),
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
						<ProfileContextProvider loaderId="viewer">
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
					path: "/views/:id",
				},
			],
		},
		// TODO fill these in ofc
		{
			path: "/signup",
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
