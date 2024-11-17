import { Link } from "react-router-dom";
import { API, api } from "../../util/api";
import {
	Box,
	Container,
	Grid2 as Grid,
	Paper,
	Divider,
	styled,
	Stack,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	ListItem,
} from "@mui/material";
import { FavoriteRounded, ListRounded, ReviewsRounded, TagRounded, ShowChartRounded } from "@mui/icons-material";
import { ActivityList } from "../ActivityList";
import { useContext, ReactNode, useState, useEffect } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";
import { RatingHistogram } from "../misc/RatingHistogram";
import { useQuery } from "@tanstack/react-query";

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

const Statistic = styled(Box)(({ theme }) => ({
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

const DirectoryItem = (props: { href: string; icon: ReactNode; name: string; count?: number }) => (
	<ListItem disablePadding>
		<ListItemButton component={Link} to={props.href}>
			<ListItemIcon>{props.icon}</ListItemIcon>
			<ListItemText
				primary={
					<Box display="flex">
						<Box flex={1}>{props.name}</Box>
						<Box paddingRight="1em">{props.count}</Box>
					</Box>
				}
			/>
		</ListItemButton>
	</ListItem>
);

type ViewerRatings = Awaited<ReturnType<API["getViewerRatings"]["query"]>>;

export const Profile = () => {
	// TODO
	// eslint-disable-next-line
	const { viewer, self } = useContext(ProfileContext);

	const { data: ratings } = useQuery({
		queryKey: ["ratings", viewer.id],
		queryFn: () => api.getViewerRatings.query(viewer.id),
	});

	return (
		<Container maxWidth="md">
			<Box width="100%">
				<h2>{viewer.name}</h2>
				<Box>
					<Grid container spacing={2} columns={3}>
						<Grid size={1}>
							<Link to="diary">
								<Statistic>
									{viewer._count.views} log{viewer._count.views === 1 ? "" : "s"}
								</Statistic>
							</Link>
						</Grid>
						<Grid size={1}>
							<Link to="followers">
								<Statistic>
									{viewer._count.followers} follower{viewer._count.followers === 1 ? "" : "s"}
								</Statistic>
							</Link>
						</Grid>
						<Grid size={1}>
							<Link to="following">
								<Statistic>{viewer._count.following} following</Statistic>
							</Link>
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
				<Box marginBottom="1em">
					recently (mobile)
					<Grid container spacing={1} columns={4}>
						{viewer.views.slice(0, 4).map((view) => (
							<Grid size={1} key={view.id}>
								<LatestEntry>{view.episode.seriesId}</LatestEntry>
							</Grid>
						))}
					</Grid>
				</Box>
				<Divider />
				<Box margin="0.5em">
					{ratings ? (
						<RatingHistogram
							width="100%"
							height="60px"
							counts={[
								ratings.oneCount,
								ratings.twoCount,
								ratings.threeCount,
								ratings.fourCount,
								ratings.fiveCount,
								ratings.sixCount,
								ratings.sevenCount,
								ratings.eightCount,
								ratings.nineCount,
								ratings.tenCount,
							]}
						/>
					) : (
						<Box width="100%" height="60px" />
					)}
				</Box>
				<Divider />
				<Box marginBottom="1em">
					<List component={Stack} direction="column">
						<DirectoryItem
							href="watchlists"
							icon={<ListRounded />}
							name="Watchlists"
							count={viewer._count.watchlists}
						/>

						<DirectoryItem
							href="reviews"
							icon={<ReviewsRounded />}
							name="Reviews"
							count={viewer._count.reviews}
						/>

						<DirectoryItem
							href="likes"
							icon={<FavoriteRounded />}
							name="Likes"
							count={viewer._count.watchlistLikes + viewer._count.viewLikes + viewer._count.episodeLikes}
						/>

						<DirectoryItem href="tags" icon={<TagRounded />} name="Tags" count={viewer._count.tags} />

						<DirectoryItem href="stats" icon={<ShowChartRounded />} name="Statistics" />
					</List>
					<Divider />
					<Box>
						<h3>Activity</h3>
						<ActivityList
							getActivity={(cursor) => api.getIndividualEvents.query({ cursor, viewerId: viewer.id })}
							queryKey={["INDIVIDUAL", viewer.id]}
						/>
					</Box>
				</Box>
			</Box>
		</Container>
	);
};
