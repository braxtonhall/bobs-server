import { Container } from "@mui/material";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./components/Landing";
import Episode from "./components/Episode";

const router = createBrowserRouter(
	[
		{
			path: "/",
			element: <Landing />,
			// errorElement: <ErrorPage />,
			// loader: rootLoader,
			// action: rootAction,
			children: [],
			// TODO other pages should probably be children?
			//  https://reactrouter.com/en/main/start/tutorial
		},
		{
			path: "/episodes/:id",
			element: <Episode />,
			loader: ({ params }) => params,
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
	return (
		<Container maxWidth="md">
			<RouterProvider router={router} />
		</Container>
	);
};

export default App;
