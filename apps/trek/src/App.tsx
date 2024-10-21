import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./components/Landing";
import Episode from "./components/Episode";
import Watchlist from "./components/Watchlist";
import { Window } from "./components/Window";
import { api } from "./util/api";

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
					path: "/episodes/:id",
					element: <Episode />,
					loader: async ({ params: { id } }) => {
						const episode = await api.getEpisode.query(id ?? "");
						if (episode) {
							return episode;
						} else {
							throw new Response("Not Found", { status: 404 });
						}
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

const App = () => <RouterProvider router={router} />;

export default App;
