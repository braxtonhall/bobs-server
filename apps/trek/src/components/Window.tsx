import {
	BottomNavigation,
	BottomNavigationAction,
	Box,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Paper,
	Stack,
} from "@mui/material";
import { Link, Outlet, useLocation, Location, useLoaderData } from "react-router-dom";
import { SearchRounded, PersonRounded, RssFeedRounded, PlayArrowRounded } from "@mui/icons-material";
import { API } from "../util/api";
import { defaultSettings, UserContext } from "../contexts/UserContext";
import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const selectValue = ({ pathname }: Location) => {
	const slugs = pathname.split("/");
	return `/${slugs[1]}`;
};

const drawerWidth = 240;

export const Window = () => {
	const value: string = selectValue(useLocation());
	const [settings, setSettings] = useState(useLoaderData() as Awaited<ReturnType<API["getSettings"]["query"]>>);
	const client = useMemo(() => new QueryClient(), []);

	return (
		<QueryClientProvider client={client}>
			<UserContext.Provider value={{ settings: settings ?? defaultSettings, setSettings }}>
				<Box
					display="flex"
					flexDirection={{ xs: "column", sm: "unset" }}
					height="100vh"
					width="100vw"
					position="absolute"
				>
					<Box
						minWidth={drawerWidth}
						height="100vh"
						display={{ xs: "none", sm: "unset" }}
						style={{ float: "left" }}
					>
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
									<ListItemButton component={Link} to="/" selected={value === "/"}>
										<ListItemIcon>
											<PlayArrowRounded />
										</ListItemIcon>
										<ListItemText primary="Watch" />
									</ListItemButton>
								</ListItem>

								<ListItem disablePadding>
									<ListItemButton component={Link} to="/explore" selected={value === "/explore"}>
										<ListItemIcon>
											<SearchRounded />
										</ListItemIcon>
										<ListItemText primary="Explore" />
									</ListItemButton>
								</ListItem>

								<ListItem disablePadding>
									<ListItemButton component={Link} to="/activity" selected={value === "/activity"}>
										<ListItemIcon>
											<RssFeedRounded />
										</ListItemIcon>
										<ListItemText primary="Activity" />
									</ListItemButton>
								</ListItem>

								<ListItem disablePadding>
									<ListItemButton component={Link} to="/me" selected={value === "/me"}>
										<ListItemIcon>
											<PersonRounded />
										</ListItemIcon>
										<ListItemText primary="Me" />
									</ListItemButton>
								</ListItem>
							</List>
						</Drawer>
					</Box>

					<Box flex="1" overflow="auto">
						<Outlet />
					</Box>

					<Box display={{ sm: "none" }} style={{ opacity: 0 }}>
						<BottomNavigation />
					</Box>

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
						<BottomNavigation value={value}>
							<BottomNavigationAction
								component={Link}
								to="/"
								label="Watch"
								value="/"
								icon={<PlayArrowRounded />}
							/>
							<BottomNavigationAction
								component={Link}
								to="/explore"
								label="Explore"
								value="/explore"
								icon={<SearchRounded />}
							/>
							<BottomNavigationAction
								component={Link}
								to="/activity"
								label="Activity"
								value="/activity"
								icon={<RssFeedRounded />}
							/>
							<BottomNavigationAction
								component={Link}
								to="/me"
								label="Me"
								value="/me"
								icon={<PersonRounded />}
							/>
						</BottomNavigation>
					</Paper>
				</Box>
			</UserContext.Provider>
		</QueryClientProvider>
	);
};
