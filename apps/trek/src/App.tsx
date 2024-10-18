import { Container, AppBar, Toolbar, IconButton, SwipeableDrawer } from "@mui/material";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./components/Landing";
import Episode from "./components/Episode";
import { Window } from "./components/Window";

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
					loader: ({ params }) => params,
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
