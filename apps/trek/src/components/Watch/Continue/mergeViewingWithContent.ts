import { Episode, SeriesCollection, Viewings } from "../types.js";

export const mergeViewingWithContent = (input: {
	viewing: Viewings[number];
	series: SeriesCollection;
	episodes: Record<string, Episode>;
}) => ({
	...input.viewing,
	watchlist: {
		...input.viewing.watchlist,
		episodes: mergeEpisodesWithContent({
			list: input.viewing.watchlist.entries,
			series: input.series,
			episodes: input.episodes,
		}),
	},
});

export const mergeEpisodesWithContent = (input: {
	list: Viewings[number]["watchlist"]["entries"];
	series: SeriesCollection;
	episodes: Record<string, Episode>;
}) =>
	input.list.map((episode) => ({
		...input.episodes[episode.episodeId],
		series: input.series[input.episodes[episode.episodeId].seriesId],
	}));

export type DecoratedViewing = ReturnType<typeof mergeViewingWithContent>;
export type DecoratedEpisodes = ReturnType<typeof mergeEpisodesWithContent>;
