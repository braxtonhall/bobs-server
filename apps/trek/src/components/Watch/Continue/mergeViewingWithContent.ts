import { Episode, SeriesCollection, Viewings } from "../types";

type Input = {
	viewing: Viewings[number];
	series: SeriesCollection;
	episodes: Record<string, Episode>;
};

export const mergeViewingWithContent = (input: Input) => ({
	...input.viewing,
	watchlist: {
		...input.viewing.watchlist,
		episodes: input.viewing.watchlist.episodes.map((episode) => ({
			...input.episodes[episode.id],
			series: input.series[input.episodes[episode.id].seriesId],
		})),
	},
});

export type DecoratedViewing = ReturnType<typeof mergeViewingWithContent>;
