import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./components/Landing";
import Episode from "./components/Episode";
import Watchlist from "./components/Watchlist";
import { Window } from "./components/Window";
import { api } from "./util/api";
import { z } from "zod";
import { Explore } from "./components/Explore";

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
					element: <Explore />,
					children: [
						{
							path: "/explore/",
							// TODO element: <Search />
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
						},
						{
							path: "/explore/views/:id",
						},
					],
				},
				{
					path: "/activity",
				},
				{
					path: "/me",
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
