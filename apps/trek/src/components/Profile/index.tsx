import { Link } from "react-router-dom";
import { api } from "../../util/api";
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
	Typography,
	IconButton,
	useTheme,
} from "@mui/material";
import {
	FavoriteRounded,
	TableRowsRounded,
	ReviewsRounded,
	TagRounded,
	ShowChartRounded,
	SettingsRounded,
} from "@mui/icons-material";
import { ActivityList } from "../ActivityList";
import { ReactNode } from "react";
import { useProfileContext } from "../../contexts/ProfileContext";
import { RatingHistogram } from "../misc/RatingHistogram";
import { useQuery } from "@tanstack/react-query";

const Favourite = styled(Paper)(({ theme }) => ({
	backgroundColor: "#fff", // TODO
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: "center",
	color: theme.palette.text.secondary,
	...theme.applyStyles("dark", {
		backgroundColor: "#1A2027", // TODO
	}),
}));

const Statistic = styled(Box)(({ theme }) => ({
	backgroundColor: "#fff", // TODO
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: "center",
	color: theme.palette.text.secondary,
	...theme.applyStyles("dark", {
		backgroundColor: "#1A2027", // TODO
	}),
}));

const LatestEntry = styled(Paper)(({ theme }) => ({
	backgroundColor: "#fff", // TODO
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: "center",
	color: theme.palette.text.secondary,
	...theme.applyStyles("dark", {
		backgroundColor: "#1A2027", // TODO
	}),
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
	color: theme.palette.text.primary,
}));

const DirectoryItem = (props: { href: string; icon: ReactNode; name: string; count?: number }) => (
	<StyledListItem disablePadding>
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
	</StyledListItem>
);

export const Profile = () => {
	const { viewer, self } = useProfileContext();

	const { data: ratings } = useQuery({
		queryKey: ["ratings", viewer.id],
		queryFn: () => api.getViewerRatings.query(viewer.id),
	});

	const theme = useTheme();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const isFollowingPage = !self && !!viewer.followers.length; // TODO
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const isFollowedByPage = !self && !!viewer.following.length; // TODO

	// noinspection HtmlUnknownTarget
	return (
		<Container maxWidth="md">
			<Box width="100%" marginTop="1em" marginBottom="1em">
				<Box display="flex">
					<Box flex={1}>
						<Typography variant="h2" color={theme.palette.text.primary}>
							{viewer.name}
						</Typography>
						{viewer.about && (
							<Typography variant="subtitle1" color={theme.palette.text.secondary}>
								{viewer.about}
							</Typography>
						)}
					</Box>
					{self && (
						<Box marginTop="1em">
							<IconButton aria-label="settings" component={Link} to="/settings">
								<SettingsRounded />
							</IconButton>
						</Box>
					)}
				</Box>

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
				<Box marginBottom="1em">
					{viewer.favourites.length > 0 && (
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
					)}
					{viewer.views.length > 0 && (
						<Box>
							recently (mobile)
							<Grid container spacing={1} columns={4}>
								{viewer.views.slice(0, 4).map((view) => (
									<Grid size={1} key={view.id}>
										<LatestEntry>{view.episode.seriesId}</LatestEntry>
									</Grid>
								))}
							</Grid>
						</Box>
					)}
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
							icon={<TableRowsRounded />}
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
					<Box marginTop="1em">
						<Typography variant="h5" color={theme.palette.text.primary}>
							Activity
						</Typography>
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
