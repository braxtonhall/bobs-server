import { Episode, SeriesCollection, Viewings } from "../types";

export const mergeViewingWithContent = (input: {
	viewing: Viewings[number];
	series: SeriesCollection;
	episodes: Record<string, Episode>;
}) => ({
	...input.viewing,
	watchlist: {
		...input.viewing.watchlist,
		episodes: mergeEpisodesWithContent({
			list: input.viewing.watchlist.episodes,
			series: input.series,
			episodes: input.episodes,
		}),
	},
});

export const mergeEpisodesWithContent = (input: {
	list: Viewings[number]["watchlist"]["episodes"];
	series: SeriesCollection;
	episodes: Record<string, Episode>;
}) =>
	input.list.map((episode) => ({
		...input.episodes[episode.id],
		series: input.series[input.episodes[episode.id].seriesId],
	}));

export type DecoratedViewing = ReturnType<typeof mergeViewingWithContent>;
