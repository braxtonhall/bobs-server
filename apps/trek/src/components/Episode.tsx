import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";
import { Box } from "@mui/material";

// https://trakt.tv/shows/star-trek/seasons/3/episodes/24

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

const Episode = () => {
	const episode = useLoaderData() as NonNullable<Awaited<ReturnType<API["getEpisode"]["query"]>>>;
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
		</>
	);
};

export default Episode;
