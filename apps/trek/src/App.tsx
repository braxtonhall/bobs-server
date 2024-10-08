import { Container, AppBar, Toolbar, IconButton } from "@mui/material";
import { Outlet, Link, createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./components/Landing";
import Episode from "./components/Episode";
import React from "react";

const router = createBrowserRouter(
	[
		{
			path: "/",
			element: (
				<>
					<AppBar position="static">
						<Toolbar variant="dense">
							<Link to="/">
								<IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
									Bob's Trek
								</IconButton>
							</Link>
						</Toolbar>
					</AppBar>
					<Container maxWidth="md">
						<Outlet />
					</Container>
				</>
			),
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
