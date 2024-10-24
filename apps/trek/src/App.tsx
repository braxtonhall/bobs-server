import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./components/Landing";
import Episode from "./components/Episode";
import Watchlist from "./components/Watchlist";
import { Window } from "./components/Window";
import { api } from "./util/api";
import { z } from "zod";
import { MobileContext } from "./util/contexts";
import { useMediaQuery } from "@mui/material";

const router = createBrowserRouter(
	[
		{
			path: "/",
			element: <Window />,
			// errorElement: <ErrorPage />,
			// loader: rootLoader,
			// action: rootAction,
			children: [
				{
					path: "",
					element: <Landing />,
				},
				{
					path: "/shows/:show",
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
					path: "/shows/:show/seasons/:season",
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
					path: "/shows/:show/seasons/:season/episodes/:episode",
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
			],
			// TODO other pages should probably be children?
			//  https://reactrouter.com/en/main/start/tutorial
		},
		// TODO fill these in ofc
		{
			path: "/viewers/:id",
		},
		{
			path: "/views/:id",
		},
		{
			path: "/signup",
		},
	],
	{ basename: process.env.PUBLIC_URL },
);

const App = () => {
	const mobile = useMediaQuery("(max-width:550px)");
	return (
		<MobileContext.Provider value={mobile}>
			<RouterProvider router={router} />
		</MobileContext.Provider>
	);
};

export default App;
