import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Landing from "./components/Watch";
import Episode from "./components/Episode";
import Watchlist from "./components/Watchlist";
import { Window } from "./components/Window";
import { api } from "./util/api";
import { z } from "zod";
import { Explore } from "./components/Explore";
import Activity from "./components/Activity";
import { Profile } from "./components/Profile";

const router = createBrowserRouter(
	[
		{
			path: "/",
			element: <Window />,
			children: [
				{
					path: "/",
					element: <Landing />,
					// errorElement: <ErrorPage />,
					// loader: rootLoader,
					// action: rootAction,
					// TODO other pages should probably be children?
					//  https://reactrouter.com/en/main/start/tutorial
				},
				{
					path: "/explore",
					element: <Outlet />,
					children: [
						{
							path: "/explore",
							element: <Explore />,
						},
						{
							path: "/explore/shows/:show",
							element: <></>,
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
							path: "/explore/shows/:show/seasons/:season",
							element: <></>,
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
							path: "/explore/shows/:show/seasons/:season/episodes/:episode",
							element: <Episode />,
							loader: async ({ params }) => {
								try {
									const episode = await api.getEpisode.query(
										z
											.object({
												season: z.coerce.number(),
												show: z.string().toUpperCase(),
												episode: z.coerce.number(),
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
							path: "/explore/watchlists/:id",
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
							path: "/explore/viewers/:id",
							loader: async ({ params: { id } }) => {
								const viewer = await api.getViewer.query(id ?? "");
								if (viewer) {
									return viewer;
								} else {
									throw new Response("Not Found", { status: 404 });
								}
							},
							element: <Profile />,
						},
						{
							path: "/explore/views/:id",
						},
					],
				},
				{
					path: "/activity",
					element: <Activity />,
				},
				{
					path: "/me",
					loader: async ({ params: { id } }) => {
						const viewer = await api.getSelf.query();
						if (viewer) {
							return viewer;
						} else {
							throw new Response("Not Found", { status: 404 });
						}
					},
					element: <Profile />,
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

const App = () => <RouterProvider router={router} />;

export default App;
