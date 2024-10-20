import { API } from "../../../util/api";
import { Box, Button, Card, CardContent } from "@mui/material";
import { RedoRounded, UndoRounded, DeleteRounded, PauseRounded } from "@mui/icons-material";
import { LogForm } from "../../LogForm";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Episode, SeriesCollection, Viewings } from "./types";
import { Progress } from "../../misc/Progress";

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
	const last = viewing.watchlist.episodes[index - 1];
	const current = viewing.watchlist.episodes[index];
	const following = viewing.watchlist.episodes
		.slice(index + 1, index + 1 + NEXT_FEW_COUNT)
		.map(({ id }) => episodes[id]);

	return (
		<Card style={{ padding: "1em" }}>
			<Box>
				<Box display="flex" alignItems="center">
					<div style={{ width: "100%", marginRight: 1 }}>
						<h1>{viewing.watchlist.name}</h1>
					</div>
					{/* TODO https://mui.com/material-ui/react-menu/#customization */}
					<Button variant="outlined" size="small">
						<PauseRounded />
					</Button>
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
						episode={episodes[current.id]}
						series={series}
						setCursor={setCursor}
						logEpisode={logEpisode}
						next={following}
						last={last?.id ?? null}
						key={current.id}
					/>
				</>
			) : (
				<></>
			)}
		</Card>
	);
};

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
		<>
			<Box marginBottom="1em" marginTop="1em">
				<LogForm episode={props.episode} logEpisode={props.logEpisode} mobile={mobile} />
			</Box>
			<Box display="flex" alignItems="center" position="relative">
				{props.last ? (
					<Button
						variant="outlined"
						onClick={() =>
							props.setCursor({
								viewingId: props.viewingId,
								episodeId: props.last,
							})
						}
						sx={{ marginRight: "auto" }}
					>
						<UndoRounded /> Back
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
					sx={{ marginLeft: "auto" }}
				>
					<RedoRounded /> Skip
				</Button>
			</Box>
		</>
	);
};
