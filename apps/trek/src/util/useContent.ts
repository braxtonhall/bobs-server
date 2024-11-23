import { useQueries } from "@tanstack/react-query";
import { api } from "./api";

export const useContent = () => {
	const [{ data: series = null }, { data: episodes = null }] = useQueries({
		queries: [
			{
				queryKey: ["series"],
				queryFn: () => api.getSeries.query(),
			},
			{
				queryKey: ["episodes"],
				queryFn: () =>
					api.getEpisodeRelationships
						.query()
						.then((episodes) => Object.fromEntries(episodes.map((episode) => [episode.id, episode]))),
			},
		],
	});

	return { series, episodes };
};
