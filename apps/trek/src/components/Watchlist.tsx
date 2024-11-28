import { Link, useLoaderData } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Fab,
	ListItemIcon,
	ListItemText,
	MenuItem,
	Snackbar,
	SnackbarCloseReason,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { api, API } from "../util/api";
import {
	EditRounded,
	FavoriteBorderRounded,
	FavoriteRounded,
	PlayArrowRounded,
	RestartAltRounded,
} from "@mui/icons-material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TagsList } from "./TagsList";
import { EpisodeCard } from "./EpisodeCard";
import { useContent } from "../hooks/useContent";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { DecoratedEpisodes, mergeEpisodesWithContent } from "./Watch/Continue/mergeViewingWithContent";
import { DateTime, Duration } from "luxon";
import { useColour } from "../hooks/useColour";
import { EpisodeHeader } from "./EpisodeHeader";
import { fadeIn } from "../util/fadeIn";
import { Options } from "./misc/Options";

// https://trakt.tv/users/yosarasara/lists/star-trek-sara-s-suggested-watch-order?sort=rank,asc

type LoaderData = NonNullable<Awaited<ReturnType<API["getWatchlist"]["query"]>>>;

const FadeInBox = fadeIn(Box);

const Watchlist = () => {
	const { watchlist, owner } = useLoaderData() as LoaderData;
	const [startDialogOpen, setStartDialogOpen] = useState(false);
	const [alertOpen, setAlertOpen] = useState(false);
	const handleCloseSnackbar = useCallback(
		(_?: SyntheticEvent | Event, reason?: SnackbarCloseReason) => reason !== "clickaway" && setAlertOpen(false),
		[],
	);

	const { data: relationship } = useQuery({
		queryKey: ["watchlist-relationship", watchlist.id],
		queryFn: () => api.getWatchlistRelationship.query(watchlist.id),
	});
	const { mutate: start } = useMutation({
		onMutate: () => {
			setStartDialogOpen(false);
			if (relationship) {
				relationship._count.inFlight++;
			}
			setAlertOpen(true);
		},
		mutationFn: () => api.startViewing.mutate(watchlist.id),
	});
	const { mutate: setLiked } = useMutation({
		onMutate: (liked) => {
			if (relationship) {
				relationship._count.likes = liked ? 1 : 0;
			}
			watchlist._count.likes += liked ? 1 : -1;
		},
		mutationFn: (liked: boolean) => api.setWatchlistLiked.mutate({ watchlistId: watchlist.id, liked }),
	});
	const { episodes, series } = useContent();
	const decorated = useMemo(
		() => episodes && series && mergeEpisodesWithContent({ list: watchlist.entries, episodes, series }),
		[episodes, series, watchlist],
	);
	const runtime = useMemo(
		() =>
			decorated &&
			Duration.fromObject({ minutes: decorated.reduce((acc, episode) => acc + episode.runtime, 0) }).toHuman(),
		[decorated],
	);
	const theme = useTheme();

	// TODO: See counts of viewings done/in-progress

	return (
		<>
			<Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
				<Alert onClose={handleCloseSnackbar} severity="success" variant="filled" sx={{ width: "100%" }}>
					New viewing started!
				</Alert>
			</Snackbar>
			<FadeInBox>
				<EpisodeHeader episode={decorated?.[0] ?? undefined} />
				<Container maxWidth="md">
					<Box marginBottom="1em">
						<Typography variant="h2" color={theme.palette.text.primary}>
							{watchlist.name}
						</Typography>
						<Box color={theme.palette.text.secondary}>
							<Typography variant="body1">{watchlist.description}</Typography>
							<Typography variant="body1">
								{watchlist.owner && (
									<>
										<Link to={`/viewers/${watchlist.owner.id}`} style={{ fontWeight: "bold" }}>
											{watchlist.owner.name}
										</Link>
										{" • "}
									</>
								)}
								{watchlist.createdAt && (
									<>{DateTime.fromISO(watchlist.createdAt.time).toLocaleString() + " • "}</>
								)}
								{`${watchlist.entries.length} episode${watchlist.entries.length === 1 ? "" : "s"}`}
								{runtime !== null && `, ${runtime}`}
							</Typography>
							<Typography variant="body1">
								{`${watchlist._count.viewings} watch${watchlist._count.viewings === 1 ? "" : "es"}, `}
								{`${watchlist._count.likes} like${watchlist._count.likes === 1 ? "" : "s"}`}
							</Typography>
						</Box>
						<Box marginTop="0.5em">
							<TagsList
								getTags={(cursor) => api.getWatchlistTags.query({ cursor, watchlistId: watchlist.id })}
								queryKey={["watchlist", watchlist.id]}
							/>
						</Box>
					</Box>
					<Divider />
					<Box>
						<Box display="flex" marginTop="1em">
							<Box display="flex" justifyContent="center" alignItems="center" marginRight="1em">
								<Fab
									sx={{ boxShadow: "none" }}
									color="primary"
									disabled={!relationship}
									onClick={() => {
										if (relationship?._count.inFlight) {
											setStartDialogOpen(true);
										} else {
											start();
										}
									}}
								>
									{relationship ? (
										relationship._count.inFlight ? (
											<RestartAltRounded />
										) : (
											<PlayArrowRounded />
										)
									) : (
										<></>
									)}
								</Fab>
								<Dialog
									open={startDialogOpen}
									onClose={() => setStartDialogOpen(false)}
									aria-labelledby="alert-dialog-title"
									aria-describedby="alert-dialog-description"
								>
									<DialogTitle id="alert-dialog-title">Start another viewing?</DialogTitle>
									<DialogContent>
										<DialogContentText id="alert-dialog-description">
											{relationship &&
												`You are currently viewing this watchlist ${relationship._count.inFlight} time${
													relationship._count.inFlight === 1 ? "" : "s"
												}`}
										</DialogContentText>
									</DialogContent>
									<DialogActions>
										<Button variant="outlined" onClick={() => start()}>
											Engage
										</Button>
										<Button
											variant="contained"
											color="error"
											onClick={() => setStartDialogOpen(false)}
											autoFocus
										>
											Belay
										</Button>
									</DialogActions>
								</Dialog>
							</Box>
							<Box display="flex" justifyContent="center" alignItems="center">
								<Checkbox
									disabled={!relationship}
									icon={<FavoriteBorderRounded />}
									checkedIcon={<FavoriteRounded />}
									checked={!!relationship?._count.likes}
									onChange={(_, checked) => setLiked(checked)}
								/>
							</Box>
							{owner && (
								<Box display="flex" justifyContent="center" alignItems="center" marginLeft="1em">
									<Options id={`options-${watchlist.id}`} horizontal>
										<MenuItem component={Link} to="edit">
											<ListItemIcon>
												<EditRounded fontSize="small" />
											</ListItemIcon>
											<ListItemText>Edit watchlist</ListItemText>
										</MenuItem>
									</Options>
								</Box>
							)}
						</Box>
					</Box>
					<Box marginBottom="1em">{decorated && <EpisodeList episodes={decorated} />}</Box>
				</Container>
			</FadeInBox>
		</>
	);
};

const selectEpisodeString = (episode: DecoratedEpisodes[number]): string => {
	if (episode.abbreviation) {
		return episode.abbreviation;
	} else {
		return `${episode.seriesId} ${episode.season}-${episode.production}`;
	}
};

const EpisodeRow = ({ episode }: { episode: DecoratedEpisodes[number] }) => {
	const colour = useColour(episode);
	const episodeString = useMemo(() => selectEpisodeString(episode), [episode]);
	return (
		<TableRow
			sx={{
				"&:last-child td, &:last-child th": { borderBottom: 0 },
				height: "100%",
			}}
		>
			<TableCell sx={{ padding: 0, height: "100%" }}>
				<Box
					sx={{
						height: "100%",
						boxSizing: "border-box",
						borderLeft: "solid 1em",
						borderLeftColor: colour,
					}}
				/>
			</TableCell>
			<TableCell padding="checkbox">
				<EpisodeCard episode={episode} height="40px" width="40px" />
			</TableCell>
			<TableCell>{episodeString}</TableCell>
			<TableCell component="th" scope="row">
				{episode.name}
			</TableCell>
			<TableCell align="right">{episode.starDate}</TableCell>
			<TableCell align="right">{episode.release}</TableCell>
		</TableRow>
	);
};

const matches =
	(search: string) =>
	(episode: DecoratedEpisodes[number]): boolean => {
		if (search === "") {
			return true;
		}
		const {
			series: { name: seriesName },
			name,
			abbreviation,
			seriesId,
		} = episode;
		return [name, seriesName, abbreviation, seriesId].some((value) =>
			String(value ?? "")
				.toLowerCase()
				.includes(search.toLowerCase()),
		);
	};

const EpisodeList = ({ episodes }: { episodes: DecoratedEpisodes }) => {
	const [search, setSearch] = useState("");
	const filteredEpisodes = useMemo(() => episodes.filter(matches(search)), [episodes, search]);
	return (
		<Box>
			<Box marginTop="1em">
				<TextField
					placeholder="Filter…"
					autoComplete="off"
					variant="standard"
					fullWidth
					onChange={(newValue) => setSearch(newValue.target.value)}
				/>
			</Box>
			<TableContainer component={Box}>
				<Table sx={{ minWidth: 650, height: "1px" }} aria-label="simple table">
					<TableHead>
						<TableRow>
							<TableCell padding="none" />
							<TableCell padding="none" />
							<TableCell>Episode</TableCell>
							<TableCell>Name</TableCell>
							<TableCell align="right">Stardate</TableCell>
							<TableCell align="right">Air Date</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filteredEpisodes.map((episode) => (
							<EpisodeRow episode={episode} key={episode.id} />
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};

export default Watchlist;
