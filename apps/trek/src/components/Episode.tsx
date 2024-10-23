import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";

// https://trakt.tv/shows/star-trek/seasons/3/episodes/24

const Episode = () => {
	const episode = useLoaderData() as NonNullable<Awaited<ReturnType<API["getEpisode"]["query"]>>>;
	return (
		<>
			<pre>Params: {JSON.stringify(episode, null, "\t")}</pre>
		</>
	);
};

export default Episode;
