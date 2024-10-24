import { API } from "../../../util/api";
import { Box, Button, Card, CardMedia } from "@mui/material";
import { PauseRounded, StopRounded, SkipPreviousRounded, SkipNextRounded } from "@mui/icons-material";
import { LogForm } from "../../LogForm";
import { Episode, SeriesCollection, Viewings } from "./types";
import { Progress } from "../../misc/Progress";
import { Deck } from "../../misc/Deck";
import { useContext } from "react";
import { MobileContext } from "../../../util/contexts";

const NEXT_FEW_COUNT = 3;

type ViewingProps = {
	viewing: Viewings[number];
	series: SeriesCollection;
	setCursor: API["updateCursor"]["mutate"];
	logEpisode: API["logEpisode"]["mutate"];
	episodes: Record<string, Episode>;
};

export const Viewing = ({ viewing, series, setCursor, logEpisode, episodes }: ViewingProps) => {
	// TODO what should happen if you are DONE???
	// TODO needs a button to just give up...

	const index = viewing.watchlist.episodes.findIndex(({ id }) => id === viewing.cursor);
	const current = viewing.watchlist.episodes[index];
	const preceding = viewing.watchlist.episodes
		.slice(0, index)
		.reverse()
		.slice(0, NEXT_FEW_COUNT)
		.map(({ id }) => episodes[id]);
	const following = viewing.watchlist.episodes
		.slice(index + 1, index + 1 + NEXT_FEW_COUNT)
		.map(({ id }) => episodes[id]);

	return (
		<Box style={{ border: "dotted" }}>
			<Box>
				<Box display="flex" alignItems="center">
					<div style={{ width: "100%", marginRight: 1 }}>
						<h1>{viewing.watchlist.name}</h1>
					</div>
				</Box>
				<Progress
					numerator={index < 0 ? viewing.watchlist.episodes.length : index}
					denominator={viewing.watchlist.episodes.length}
				/>
			</Box>

			{current ? (
				<>
					<CurrentEpisode
						viewingId={viewing.id}
						episode={episodes[current.id]}
						series={series}
						setCursor={setCursor}
						logEpisode={logEpisode}
						following={following}
						preceding={preceding}
						key={current.id}
					/>
				</>
			) : (
				<></>
			)}
		</Box>
	);
};

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

const CurrentEpisode = (props: {
	viewingId: string;
	episode: Episode;
	following: Episode[];
	preceding: Episode[];
	series: SeriesCollection;
	setCursor: API["updateCursor"]["mutate"];
	logEpisode: API["logEpisode"]["mutate"];
}) => {
	const mobile = useContext(MobileContext);
	return (
		<>
			<Box marginBottom="1em" marginTop="1em">
				<LogForm episode={props.episode} logEpisode={props.logEpisode} mobile={mobile} />
			</Box>
			<Box display="flex" alignItems="center" position="relative">
				<Deck stackDirection="down" verticalPxIncrement={4} style={{ marginRight: "auto" }}>
					{props.preceding.map((episode, index) => (
						<Card
							key={episode.id}
							sx={{
								backgroundColor: "antiquewhite",
								width: "150px",
								height: "40px",
								display: "flex",
								flexDirection: "row",
								padding: "0.5em",
							}}
						>
							{index === 0 ? (
								<>
									<Card
										style={{
											width: "77px",
											height: "40px",
											marginRight: "0.5em",
											position: "relative",
										}}
									>
										<CardMedia
											alt={episode.name}
											image={IMG_URL}
											component="img"
											sx={{
												position: "absolute",
												top: 0,
												right: 0,
												height: "100%",
												width: "100%",
											}}
										/>
									</Card>
									<Button
										variant="outlined"
										onClick={() =>
											props.setCursor({
												viewingId: props.viewingId,
												episodeId: props.preceding[0]?.id ?? null,
											})
										}
										style={{}}
									>
										<SkipPreviousRounded />
									</Button>
								</>
							) : (
								<></>
							)}
						</Card>
					))}
				</Deck>

				<Button variant="outlined" size="small" color="info" style={{ marginLeft: "20%" }}>
					<PauseRounded />
				</Button>

				<Button variant="outlined" size="small" color="error" style={{ marginRight: "20%" }}>
					<StopRounded />
				</Button>

				<Deck stackDirection="down" verticalPxIncrement={4} style={{ marginLeft: "auto" }}>
					{props.following.map((episode, index) => (
						<Card
							key={episode.id}
							sx={{
								backgroundColor: "antiquewhite",
								width: "150px",
								height: "40px",
								display: "flex",
								flexDirection: "row",
								padding: "0.5em",
							}}
						>
							{index === 0 ? (
								<>
									<Button
										variant="outlined"
										onClick={() =>
											props.setCursor({
												viewingId: props.viewingId,
												episodeId: props.following[0]?.id ?? null,
											})
										}
									>
										<SkipNextRounded />
									</Button>
									<Card
										style={{
											width: "77px",
											height: "40px",
											marginLeft: "0.5em",
											position: "relative",
										}}
									>
										<CardMedia
											alt={episode.name}
											image={IMG_URL}
											component="img"
											sx={{
												position: "absolute",
												top: 0,
												right: 0,
												height: "100%",
												width: "100%",
											}}
										/>
									</Card>
								</>
							) : (
								<></>
							)}
						</Card>
					))}
				</Deck>
			</Box>
		</>
	);
};
