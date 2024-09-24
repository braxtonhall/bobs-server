import { Episode, UserSettings } from "../types";
import { Box, CircularProgress, Fade } from "@mui/material";

const Watch = (props: { episodes: Episode[] | null; settings: UserSettings | null }) => {
	return (
		<>
			<Box display="flex" justifyContent="center">
				<Fade
					in={props.episodes === null}
					style={{
						transitionDelay: props.episodes ? "800ms" : "0ms",
					}}
					unmountOnExit
				>
					<CircularProgress />
				</Fade>
			</Box>
			<Box>
				<p>Something else here</p>
			</Box>
		</>
	);
};

export default Watch;
