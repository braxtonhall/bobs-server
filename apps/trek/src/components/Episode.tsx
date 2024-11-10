import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";
import { Box, useTheme } from "@mui/material";
import { RatingHistogram } from "./misc/RatingHistogram";

// https://trakt.tv/shows/star-trek/seasons/3/episodes/24

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

const Episode = () => {
	const episode = useLoaderData() as NonNullable<Awaited<ReturnType<API["getEpisode"]["query"]>>>;
	const theme = useTheme();
	return (
		<>
			<Box
				sx={{
					padding: 0,
					backgroundImage: `url('${IMG_URL}')`,
					backgroundRepeat: "no-repeat",
					backgroundSize: "cover",
					height: "200px",
				}}
			/>
			Params: {JSON.stringify(episode, null, "\t")}
			<RatingHistogram
				bgcolor={theme.palette.grey.A100}
				counts={[
					episode.oneCount,
					episode.twoCount,
					episode.threeCount,
					episode.fourCount,
					episode.fiveCount,
					episode.sixCount,
					episode.sevenCount,
					episode.eightCount,
					episode.nineCount,
					episode.tenCount,
				]}
				width="100%"
				height="100px"
			/>
		</>
	);
};

export default Episode;
