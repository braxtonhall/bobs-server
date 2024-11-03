import { useState } from "react";
import {
	BottomNavigation,
	BottomNavigationAction,
	Box,
	Container,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Paper,
	Stack,
} from "@mui/material";
import { Link, Outlet } from "react-router-dom";
import { SearchRounded, PersonRounded, RssFeedRounded, PlayArrowRounded } from "@mui/icons-material";

const drawerWidth = 240;

export const Window = () => {
	const [value, setValue] = useState("watch");

	return (
		<Box display={{ xs: "unset", sm: "flex" }}>
			<Box minWidth={drawerWidth} height="100vh" display={{ xs: "none", sm: "unset" }} style={{ float: "left" }}>
				<Drawer
					variant="permanent"
					sx={{
						display: "flex",
						"& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
					}}
					open
				>
					<List component={Stack} direction="column">
						<ListItem disablePadding>
							<ListItemButton
								component={Link}
								to="/"
								selected={value === "watch"}
								onClick={() => setValue("watch")}
							>
								<ListItemIcon>
									<PlayArrowRounded />
								</ListItemIcon>
								<ListItemText primary="Watch" />
							</ListItemButton>
						</ListItem>

						<ListItem disablePadding>
							<ListItemButton
								component={Link}
								to="/explore"
								selected={value === "explore"}
								onClick={() => setValue("explore")}
							>
								<ListItemIcon>
									<SearchRounded />
								</ListItemIcon>
								<ListItemText primary="Explore" />
							</ListItemButton>
						</ListItem>

						<ListItem disablePadding>
							<ListItemButton
								component={Link}
								to="/activity"
								selected={value === "activity"}
								onClick={() => setValue("activity")}
							>
								<ListItemIcon>
									<RssFeedRounded />
								</ListItemIcon>
								<ListItemText primary="Activity" />
							</ListItemButton>
						</ListItem>

						<ListItem disablePadding>
							<ListItemButton
								component={Link}
								to="/me"
								selected={value === "me"}
								onClick={() => setValue("me")}
							>
								<ListItemIcon>
									<PersonRounded />
								</ListItemIcon>
								<ListItemText primary="Me" />
							</ListItemButton>
						</ListItem>
					</List>
				</Drawer>
			</Box>
			<Box flexGrow="1">
				<Outlet />

				<Paper
					sx={{
						position: "fixed",
						bottom: 0,
						left: 0,
						right: 0,
						display: {
							xs: "unset",
							sm: "none",
						},
					}}
					elevation={3}
				>
					<BottomNavigation value={value} onChange={(_, newValue) => setValue(newValue)}>
						<BottomNavigationAction
							component={Link}
							to="/"
							label="Watch"
							value="watch"
							icon={<PlayArrowRounded />}
						/>
						<BottomNavigationAction
							component={Link}
							to="/explore"
							label="Explore"
							value="explore"
							icon={<SearchRounded />}
						/>
						<BottomNavigationAction
							component={Link}
							to="/activity"
							label="Activity"
							value="activity"
							icon={<RssFeedRounded />}
						/>
						<BottomNavigationAction
							component={Link}
							to="/me"
							label="Me"
							value="me"
							icon={<PersonRounded />}
						/>
					</BottomNavigation>
				</Paper>
			</Box>
		</Box>
	);
};
