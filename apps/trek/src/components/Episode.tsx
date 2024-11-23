import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";
import { useTheme } from "@mui/material";
import { RatingHistogram } from "./misc/RatingHistogram";
import { EpisodeHeader } from "./EpisodeHeader";
import { useContent } from "../util/useContent";
import { useMemo } from "react";
import { mergeEpisodesWithContent } from "./Watch/Continue/mergeViewingWithContent";

// https://trakt.tv/shows/star-trek/seasons/3/episodes/24

const Episode = () => {
	const episode = useLoaderData() as NonNullable<Awaited<ReturnType<API["getEpisode"]["query"]>>>;
	const theme = useTheme();

	// TODO all of this is not needed!!!
	const { episodes, series } = useContent();
	const decorated = useMemo(
		() => episodes && series && mergeEpisodesWithContent({ list: [episode], episodes, series }),
		[episodes, series, episode],
	);

	return (
		<>
			{/* TODO get episode relationship!!! */}
			{decorated && <EpisodeHeader episode={decorated[0]} />}
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
