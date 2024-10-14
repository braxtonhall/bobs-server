import { API } from "../../../util/api";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { InfoRounded, RedoRounded, UndoRounded, DeleteRounded } from "@mui/icons-material";
import { LogForm } from "../../LogForm";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";
import { SeriesCollection, Viewings } from "./types";
import { Progress } from "../../misc/Progress";

const NEXT_FEW_COUNT = 2;

type ViewingProps = {
	viewing: Viewings[number];
	series: SeriesCollection;
	setCursor: API["updateCursor"]["mutate"];
	logEpisode: API["logEpisode"]["mutate"];
};

export const Viewing = ({ viewing, series, setCursor, logEpisode }: ViewingProps) => {
	// TODO what should happen if you are DONE???
	// TODO needs a button to just give up...

	const index = viewing.watchlist.episodes.findIndex(({ id }) => id === viewing.cursor);
	const last = viewing.watchlist.episodes[index - 1];
	const current = viewing.watchlist.episodes[index];
	const following = viewing.watchlist.episodes.slice(index + 1, index + 1 + NEXT_FEW_COUNT);

	return (
		<Card>
			<Box>
				<Box display="flex" alignItems="center">
					<div style={{ width: "100%", marginRight: 1 }}>
						<h1>{viewing.watchlist.name}</h1>
					</div>
					<Button variant="outlined" color="error" size="small">
						<DeleteRounded />
					</Button>
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
						episode={current}
						series={series}
						setCursor={setCursor}
						logEpisode={logEpisode}
						next={following}
						last={last?.id ?? null}
					/>
				</>
			) : (
				<></>
			)}
		</Card>
	);
};

type Episode = ViewingProps["viewing"]["watchlist"]["episodes"][number];

const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

const CurrentEpisode = (props: {
	viewingId: string;
	episode: Episode;
	last: string | null;
	next: Episode[];
	series: SeriesCollection;
	setCursor: API["updateCursor"]["mutate"];
	logEpisode: API["logEpisode"]["mutate"];
}) => {
	const mobile = useMediaQuery("(max-width:550px)");
	return (
		<Card style={{ margin: "1em", position: "relative", backgroundColor: "grey" }}>
			<CardContent
				style={{
					position: "relative",
					backgroundColor: "transparent",
					color: "white",
					width: "100%",
					boxSizing: "border-box",
					borderSpacing: "0.5em",
				}}
			>
				<Box border="dotted" display="flex" alignItems="center" position="relative">
					<Card style={{ width: "100px", height: "100px", backgroundColor: "gainsboro" }}></Card>

					<Box sx={mobile ? {} : { display: "table-cell", width: "100%" }} border="dotted">
						<Typography variant="h5" component="h2">
							{props.episode.name}
						</Typography>

						<Typography variant="body2" component="p">
							{props.episode.abbreviation ?? props.episode.seriesId}
							{props.episode.abbreviation === null
								? ` Season ${props.episode.season}, Episode ${props.episode.production}`
								: ""}
						</Typography>

						<Typography sx={{ fontSize: 14 }}>
							{DateTime.fromISO(props.episode.release as never as string, { zone: "utc" }).toLocaleString(
								{
									month: "2-digit",
									year: "numeric",
									day: "2-digit",
								},
							)}
						</Typography>
					</Box>

					<Box
						display={mobile ? "flex" : "table-cell"}
						justifyContent="center"
						alignItems="center"
						sx={{ float: "none", minWidth: mobile ? undefined : "220px", verticalAlign: "middle" }}
					>
						<Stack direction={mobile ? "row" : "column"}>
							{props.last ? (
								<Button
									variant="outlined"
									onClick={() =>
										props.setCursor({
											viewingId: props.viewingId,
											episodeId: props.last,
										})
									}
								>
									<UndoRounded />
								</Button>
							) : (
								<></>
							)}

							<Button
								variant="outlined"
								onClick={() =>
									props.setCursor({
										viewingId: props.viewingId,
										episodeId: props.next[0]?.id ?? null,
									})
								}
							>
								<RedoRounded />
							</Button>
							<Link to={`/episodes/${props.episode.id}`} style={mobile ? {} : { width: "100%" }}>
								<Button variant="outlined" style={mobile ? {} : { width: "100%" }}>
									<InfoRounded />
								</Button>
							</Link>
						</Stack>
					</Box>
				</Box>

				<LogForm episode={props.episode} logEpisode={props.logEpisode} />
			</CardContent>
		</Card>
	);
};
