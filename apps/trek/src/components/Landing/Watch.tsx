import {
	Box,
	CircularProgress,
	Fade,
	Card,
	CardContent,
	CardMedia,
	Typography,
	Button,
	CardActionArea,
	CardActions,
	Collapse,
} from "@mui/material";
import { CurrentlyWatching, SeriesCollection } from "../../util/api";
import { ReactElement, useState } from "react";
import { Link } from "react-router-dom";

const NEXT_FEW_COUNT = 3;

interface WatchProps {
	currently: CurrentlyWatching | null;
	series: SeriesCollection | null;
	setCursor: (id: string | null) => void;
}

const Watch = (props: WatchProps) => {
	return (
		<>
			<Box position="relative" width="100%" boxSizing="border-box">
				<Fade in={props.currently === null} unmountOnExit>
					<Box
						position="absolute"
						height="100%"
						width="100%"
						boxSizing="border-box"
						display="flex"
						justifyContent="center"
						alignItems="center"
						bgcolor="white"
					>
						<CircularProgress />
					</Box>
				</Fade>
				{props.currently && props.series ? (
					props.currently.watching ? (
						<WatchContent
							watchlist={props.currently.watching}
							current={props.currently.current}
							series={props.series}
							setCursor={props.setCursor}
						/>
					) : (
						<WatchInactive />
					)
				) : (
					<></>
				)}
			</Box>
		</>
	);
};

type WatchContentProps = {
	watchlist: NonNullable<CurrentlyWatching["watching"]>;
	current: CurrentlyWatching["current"];
	series: SeriesCollection;
	setCursor: (id: string | null) => void;
};

const WatchContent = (props: WatchContentProps) => {
	// TODO what should happen if you are DONE???

	const index = props.watchlist.episodes.findIndex(({ id }) => id === props.current?.id);
	const last = props.watchlist.episodes[index - 1];
	const current = props.watchlist.episodes[index];
	const following = props.watchlist.episodes.slice(index + 1, index + 1 + NEXT_FEW_COUNT);

	return (
		<>
			<h1>{props.watchlist.name}</h1>
			<h2>{props.watchlist.description}</h2>
			{last ? <LastEpisode episode={last} series={props.series} setCursor={props.setCursor} /> : <></>}
			{current ? (
				<Upcoming episode={current} series={props.series} following={following} setCursor={props.setCursor} />
			) : (
				<></>
			)}
		</>
	);
};

type Episode = WatchContentProps["watchlist"]["episodes"][number];

const LastEpisode = (props: { episode: Episode; series: SeriesCollection; setCursor: (id: string | null) => void }) => (
	<>
		Last Episode
		<EpisodeCard episode={props.episode} series={props.series} small={true}>
			<Button onClick={() => props.setCursor(props.episode.id)}>Go Back</Button>
		</EpisodeCard>
	</>
);

const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";
const DESCRIPTION =
	"Kirk and his crew are at deadly risk from an alien creature that feeds on the salt in a human body and can take on any form.";

const Upcoming = (props: {
	episode: Episode;
	series: SeriesCollection;
	following: Episode[];
	setCursor: (id: string | null) => void;
}) => (
	<>
		Upcoming
		<EpisodeCard episode={props.episode} series={props.series} small={false}>
			<Button>Log</Button>
			<Button onClick={() => props.setCursor(props.following[0]?.id ?? null)}>Skip</Button>
		</EpisodeCard>
		{props.following.map((episode) => (
			<UpcomingEpisode episode={episode} series={props.series} />
		))}
	</>
);

const UpcomingEpisode = (props: { episode: Episode; series: SeriesCollection }) => (
	<EpisodeCard episode={props.episode} series={props.series} small={true} />
);

const EpisodeCard = (props: {
	episode: Episode;
	series: SeriesCollection;
	children?: ReactElement | ReactElement[];
	small: boolean;
}) => {
	const [expanded, setExpanded] = useState(!props.small);
	return (
		<Card style={{ margin: "1em" }}>
			<CardActionArea style={{ position: "relative" }} onClick={() => setExpanded(!expanded)}>
				<CardMedia
					image={IMG_URL}
					component="img"
					alt={props.episode.name}
					style={{
						position: "absolute",
						top: 0,
						right: 0,
						height: "100%",
						width: "100%",
					}}
				/>
				<CardContent
					style={{
						position: "relative",
						backgroundColor: "transparent",
						color: "white",
					}}
				>
					<Typography variant="h5" component="h2" sx={{ fontSize: props.small ? 12 : undefined }}>
						{props.episode.name}
					</Typography>

					<Typography variant="body2" component="p" sx={{ fontSize: props.small ? 12 : undefined }}>
						{props.episode.abbreviation ?? props.episode.seriesId}
						{props.episode.abbreviation === null
							? ` Season ${props.episode.season}, Episode ${props.episode.production}`
							: ""}
					</Typography>

					<Typography sx={{ fontSize: props.small ? 12 : 14 }}>
						{String(props.episode.release).slice(0, 10) /* TODO this is terrible */}
					</Typography>

					<Collapse in={expanded} timeout="auto" unmountOnExit>
						{props.episode.description || DESCRIPTION}
					</Collapse>
				</CardContent>
			</CardActionArea>
			<Collapse in={expanded} timeout="auto" unmountOnExit>
				<CardActions>
					{props.children}
					<Link to={`/episodes/${props.episode.id}`}>
						<Button>Info</Button>
					</Link>
				</CardActions>
			</Collapse>
		</Card>
	);
};

const WatchInactive = () => <p>You are not watching anything at the moment</p>; // TODO

export default Watch;
