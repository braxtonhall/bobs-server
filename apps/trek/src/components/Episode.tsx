import { useLoaderData } from "react-router-dom";
import { API } from "../util/api";

const Episode = () => {
	const episode = useLoaderData() as NonNullable<Awaited<ReturnType<API["getEpisode"]["query"]>>>;
	return (
		<>
			<pre>Params: {JSON.stringify(episode, null, "\t")}</pre>
		</>
	);
};

export default Episode;
