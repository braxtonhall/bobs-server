import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";
import { Box, Container, Grid2 as Grid, Paper, styled } from "@mui/material";

// TODO: Need the following:
//  0. My favourite episodes
//  1. Watchlists that I made
//  2. Watchlists that I saved
//  3. Watchlists in progress
//  3. Reviews that I liked
//  4. Profiles that I follow
//  5. Profiles following me
//  5. My activity
//  6. My diary
//  7. My tags???

const Favourite = styled(Paper)(({ theme }) => ({
	backgroundColor: "#fff",
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: "center",
	color: theme.palette.text.secondary,
	...theme.applyStyles("dark", {
		backgroundColor: "#1A2027",
	}),
}));

const Statistic = styled(Paper)(({ theme }) => ({
	backgroundColor: "#fff",
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: "center",
	color: theme.palette.text.secondary,
	...theme.applyStyles("dark", {
		backgroundColor: "#1A2027",
	}),
}));

const LatestEntry = styled(Paper)(({ theme }) => ({
	backgroundColor: "#fff",
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: "center",
	color: theme.palette.text.secondary,
	...theme.applyStyles("dark", {
		backgroundColor: "#1A2027",
	}),
}));

export const Profile = () => {
	const { viewer, self } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getViewer"]["query"]>>>;
	return (
		<Container maxWidth="sm">
			<Box>
				<h2>{viewer.name}</h2>
				<Box>
					<Grid container spacing={2} columns={3}>
						<Grid size={1}>
							<Statistic>
								{viewer._count.views} log{viewer._count.views === 1 ? "" : "s"}
							</Statistic>
						</Grid>
						<Grid size={1}>
							<Statistic>
								{viewer._count.followers} follower{viewer._count.followers === 1 ? "" : "s"}
							</Statistic>
						</Grid>
						<Grid size={1}>
							<Statistic>{viewer._count.following} following</Statistic>
						</Grid>
					</Grid>
				</Box>
				<Box>
					favourites
					<Grid container spacing={2} columns={4}>
						<Grid size={1}>
							<Favourite>favourite</Favourite>
						</Grid>
						<Grid size={1}>
							<Favourite>favourite</Favourite>
						</Grid>
						<Grid size={1}>
							<Favourite>favourite</Favourite>
						</Grid>
						<Grid size={1}>
							<Favourite>favourite</Favourite>
						</Grid>
					</Grid>
				</Box>
				<Box>
					recently
					<Grid container spacing={1} columns={24}>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
						<Grid size={1}>
							<LatestEntry></LatestEntry>
						</Grid>
					</Grid>
				</Box>
			</Box>
		</Container>
	);
};
