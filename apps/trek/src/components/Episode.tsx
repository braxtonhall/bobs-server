import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";
import { useTheme } from "@mui/material";
import { RatingHistogram } from "./misc/RatingHistogram";
import { EpisodeHeader } from "./EpisodeHeader";

// https://trakt.tv/shows/star-trek/seasons/3/episodes/24

const Episode = () => {
	const { episode, relationship } = useLoaderData() as {
		episode: NonNullable<Awaited<ReturnType<API["getEpisode"]["query"]>>>;
		relationship: NonNullable<Awaited<ReturnType<API["getEpisodeRelationship"]["query"]>>>;
	};
	const theme = useTheme();

	return (
		<>
			<EpisodeHeader
				episode={{
					...episode,
					...relationship,
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
