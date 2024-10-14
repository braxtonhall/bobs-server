import { Box, CircularProgress, Fade } from "@mui/material";
import { API } from "../../../util/api";
import { Viewing } from "./Viewing";
import { SeriesCollection, Viewings } from "./types";

interface WatchProps {
	viewings: Viewings;
	series: SeriesCollection | null;
	setCursor: API["updateCursor"]["mutate"];
	logEpisode: API["logEpisode"]["mutate"];
}

const Watch = (props: WatchProps) => {
	return (
		<>
			<Box position="relative" width="100%" boxSizing="border-box">
				<Fade in={props.viewings.length === 0} unmountOnExit>
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
				{props.viewings.length && props.series ? (
					props.viewings.map((viewing) => (
						<Viewing
							key={viewing.id}
							viewing={viewing}
							series={props.series! /* TODO ??? */}
							setCursor={props.setCursor}
							logEpisode={props.logEpisode}
						/>
					))
				) : (
					<WatchInactive />
				)}
			</Box>
		</>
	);
};

const WatchInactive = () => <p>You are not watching anything at the moment</p>; // TODO

export default Watch;
