import { useQueries } from "@tanstack/react-query";
import { API, api } from "../util/api";
import { useCallback } from "react";

export type Episode = Awaited<ReturnType<API["getEpisodeRelationships"]["query"]>>[number];

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

	const setOpinion = useCallback(
		(env: { episodeId: string; liked: boolean; rating: number | null }) => {
			if (episodes) {
				episodes[env.episodeId]._count.views++;
				episodes[env.episodeId].opinions[0] = {
					episodeId: env.episodeId,
					liked: env.liked,
					rating: env.rating,
					// i am sure this will bite me in the butt one day
					viewerId: "viewerId",
				};
			}
		},
		[episodes],
	);

	return { series, episodes, setOpinion };
};
