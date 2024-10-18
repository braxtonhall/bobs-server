import { useState } from "react";
import { AppBar, Container, IconButton, SwipeableDrawer, Toolbar } from "@mui/material";
import { Link, Outlet } from "react-router-dom";

export const Window = () => {
	const [drawer, setDrawer] = useState(false);

	const toggleDrawer = (open: boolean) => () => setDrawer(open);

	return (
		<>
			<AppBar position="static">
				<Toolbar variant="dense">
					<IconButton onClick={toggleDrawer(true)}>...</IconButton>
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
			<SwipeableDrawer anchor="left" open={drawer} onClose={toggleDrawer(false)} onOpen={toggleDrawer(true)}>
				<p>Me!</p>
				<p>Settings</p>
				<IconButton onClick={toggleDrawer(false)}>{"<- Back"}</IconButton>
			</SwipeableDrawer>
		</>
	);
};
