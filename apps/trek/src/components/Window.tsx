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
	ThemeProvider,
} from "@mui/material";
import { Link, Location, useLoaderData, useLocation } from "react-router-dom";
import { PlayCircleOutlineRounded, RssFeedRounded, SearchRounded } from "@mui/icons-material";
import { api, API } from "../util/api";
import { defaultSettings, UserContext } from "../contexts/UserContext";
import { ReactNode, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { StorageKind, useStorage } from "../hooks/useStorage";
import { ThemeModeContext } from "../contexts/ThemeModeContext";
import { useThemeMode } from "../hooks/useThemeMode";
import { Gravatar } from "./misc/Gravatar";

const selectValue = ({ pathname }: Location, me: string) => {
	const slugs = pathname.split("/");
	if (pathname.startsWith(me) && `/${slugs[1]}/${slugs[2]}`) {
		return "/me";
	}
	return `/${slugs[1]}`;
};

const drawerWidth = 240;

export const Window = ({ children }: { children?: ReactNode | ReactNode[] }) => {
	const themeStorage = useStorage(StorageKind.Theme);
	const [mode, setMode] = useState(themeStorage.get());
	const theme = useThemeMode(mode);
	const loaderData = useLoaderData() as Partial<Awaited<ReturnType<API["getSelf"]["query"]>>>;
	const [settings, setSettings] = useState(loaderData?.settings ?? null);
	const { mutate: updateSettings } = useMutation({ mutationFn: api.setSettings.mutate, onMutate: setSettings });
	const me = loaderData?.viewer ? `/viewers/${loaderData.viewer.id}` : "/login";
	const value = selectValue(useLocation(), me);

	return (
		<ThemeModeContext.Provider
			value={{
				setMode: (theme) => {
					themeStorage.set(theme);
					setMode(theme);
				},
				mode,
			}}
		>
			<ThemeProvider theme={theme}>
				<UserContext.Provider value={{ settings: settings ?? defaultSettings, setSettings: updateSettings }}>
					<Box
						display="flex"
						flexDirection={{ xs: "column", sm: "unset" }}
						height="100vh"
						width="100vw"
						position="absolute"
						bgcolor={theme.palette.background.default}
					>
						<Box
							minWidth={drawerWidth}
							height="100vh"
							display={{ xs: "none", sm: "unset" }}
							sx={{ float: "left" }}
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
												<PlayCircleOutlineRounded />
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
										<ListItemButton
											component={Link}
											to="/activity"
											selected={value === "/activity"}
										>
											<ListItemIcon>
												<RssFeedRounded />
											</ListItemIcon>
											<ListItemText primary="Activity" />
										</ListItemButton>
									</ListItem>

									<ListItem disablePadding>
										<ListItemButton component={Link} to={me} selected={value === "/me"}>
											<ListItemIcon>
												<Gravatar
													hash={
														(settings?.gravatar && loaderData.viewer?.email.gravatar) ||
														null
													}
													sx={{ width: 24, height: 24 }}
												/>
											</ListItemIcon>
											<ListItemText primary="Me" />
										</ListItemButton>
									</ListItem>
								</List>
							</Drawer>
						</Box>

						<Box flex="1" overflow="auto">
							{children}
						</Box>

						<Box display={{ sm: "none" }} sx={{ opacity: 0 }}>
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
									icon={<PlayCircleOutlineRounded />}
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
									to={me}
									label="Me"
									value="/me"
									icon={
										<Gravatar
											hash={(settings?.gravatar && loaderData.viewer?.email.gravatar) || null}
											sx={{ width: 24, height: 24 }}
										/>
									}
								/>
							</BottomNavigation>
						</Paper>
					</Box>
				</UserContext.Provider>
			</ThemeProvider>
		</ThemeModeContext.Provider>
	);
};
