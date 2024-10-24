import { useState } from "react";
import { alpha, AppBar, Box, Container, IconButton, styled, SwipeableDrawer, Toolbar, useTheme } from "@mui/material";
import { Link, Outlet } from "react-router-dom";
import { SearchRounded, SettingsRounded, PersonRounded, HomeRounded } from "@mui/icons-material";
import { Explore } from "./Explore";
import { DebouncedTextField } from "./misc/DebouncedTextField";

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
}));

const Search = styled("div")(({ theme }) => ({
	position: "relative",
	borderRadius: theme.shape.borderRadius,
	backgroundColor: alpha(theme.palette.common.white, 0.15),
	"&:hover": {
		backgroundColor: alpha(theme.palette.common.white, 0.25),
	},
	marginLeft: 0,
	width: "100%",
	[theme.breakpoints.up("sm")]: {
		marginLeft: theme.spacing(1),
		width: "auto",
	},
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
	padding: theme.spacing(0, 2),
	height: "100%",
	position: "absolute",
	pointerEvents: "none",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
}));

const StyledInputBase = styled(DebouncedTextField)(({ theme }) => ({
	color: "inherit",
	width: "100%",
	"& .MuiInputBase-input": {
		padding: theme.spacing(1, 1, 1, 0),
		// vertical padding + font size from searchIcon
		paddingLeft: `calc(1em + ${theme.spacing(4)})`,
		transition: theme.transitions.create("width"),
		[theme.breakpoints.up("sm")]: {
			width: "12ch",
			"&:focus": {
				width: "20ch",
			},
		},
	},
}));

export const Window = () => {
	const theme = useTheme();
	const [drawer, setDrawer] = useState(false);
	const [search, setSearch] = useState("");

	const toggleDrawer = (open: boolean) => () => setDrawer(open);

	return (
		<>
			<AppBar position="sticky" style={{ zIndex: theme.zIndex.drawer + 1 }}>
				<Toolbar variant="dense">
					<Link to="/">
						<IconButton edge="start" aria-label="menu" sx={{ mr: 2 }} onClick={toggleDrawer(false)}>
							<HomeRounded />
						</IconButton>
					</Link>

					<Search>
						<SearchIconWrapper>
							<SearchRounded />
						</SearchIconWrapper>
						<StyledInputBase
							fullWidth
							placeholder={"Search..."}
							onInput={toggleDrawer(true)}
							onClick={toggleDrawer(true)}
							onChange={(search) => setSearch(search.target.value)}
							autoComplete="off"
						/>
					</Search>

					<Link to="/me">
						<IconButton edge="end" aria-label="me">
							<PersonRounded />
						</IconButton>
					</Link>
					<Link to="/settings">
						<IconButton edge="end" aria-label="settings">
							<SettingsRounded />
						</IconButton>
					</Link>
				</Toolbar>
			</AppBar>
			<Container maxWidth="md">
				<Outlet />
			</Container>
			<SwipeableDrawer
				variant="temporary"
				anchor="top"
				open={drawer}
				disableEnforceFocus
				disableAutoFocus
				onClose={toggleDrawer(false)}
				onOpen={toggleDrawer(true)}
			>
				<Box style={{ height: "95vh" }}>
					<DrawerHeader />
					<Explore search={search} />
				</Box>
			</SwipeableDrawer>
		</>
	);
};
