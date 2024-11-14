import { Box, Button } from "@mui/material";
import { api, API } from "../../../util/api";
import { Viewing } from "./Viewing";
import { Episode, SeriesCollection } from "../types";
import { useCallback, useMemo, useState } from "react";
import { mergeViewingWithContent } from "./mergeViewingWithContent";
import { useInfiniteQuery } from "@tanstack/react-query";

interface ContinueProps {
	series: SeriesCollection | null;
	episodes: Record<string, Episode> | null;
	setEpisodes: (episodes: Record<string, Episode>) => void;
}

const Continue = ({ series, episodes, setEpisodes }: ContinueProps) => {
	// TODO are these useful? {error, isFetchingNextPage, status}
	const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
		queryKey: ["continue"],
		queryFn: ({ pageParam }) => api.getCurrentlyWatching.query(pageParam),
		initialPageParam: undefined as undefined | string,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
	const [, updateState] = useState<unknown>();
	const forceUpdate = useCallback(() => updateState({}), []);
	const viewings = useMemo(() => data?.pages.flatMap((page) => page.viewings) ?? [], [data]);
	const logAndSetEpisode: API["logEpisode"]["mutate"] = useCallback(
		(env) => {
			viewings.forEach((viewing) => {
				if (viewing.cursor === env.episodeId) {
					const currentIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === env.episodeId);
					if (currentIndex >= 0) {
						const next = viewing.watchlist.episodes[currentIndex + 1];
						viewing.cursor = next?.id ?? null;
					}
				}
				return viewing;
			});
			if (episodes) {
				episodes[env.episodeId]._count.views++;
				episodes[env.episodeId].opinions[0] = {
					episodeId: env.episodeId,
					liked: env.liked,
					rating: env.rating,
					// i am sure this will bite me in the butt one day
					viewerId: "viewerId",
				};
				setEpisodes(episodes);
			}
			forceUpdate();
			return api.logEpisode.mutate(env);
		},
		[viewings, forceUpdate, episodes, setEpisodes],
	);

	const setCursor: API["updateCursor"]["mutate"] = useCallback(
		(env) => {
			viewings.forEach((viewing) => {
				if (viewing.id === env.viewingId) {
					viewing.cursor = env.episodeId;
				}
			});
			forceUpdate();
			return api.updateCursor.mutate(env);
		},
		[viewings, forceUpdate],
	);

	return (
		<Box position="relative" width="100%" boxSizing="border-box">
			{!hasNextPage && !viewings.length ? (
				<ContinueInactive />
			) : viewings.length && series && episodes ? (
				viewings.map(
					((series, episodes) => (viewing) => (
						<Viewing
							key={viewing.id}
							viewing={mergeViewingWithContent({ viewing, series, episodes })}
							setCursor={setCursor}
							logEpisode={logAndSetEpisode}
						/>
					))(series, episodes),
				)
			) : (
				<></>
			)}

			{hasNextPage ? (
				<Button disabled={isFetching} onClick={() => fetchNextPage()}>
					Load more
				</Button>
			) : (
				<></>
			)}
		</Box>
	);
};

const ContinueInactive = () => <p>You are not watching anything at the moment</p>; // TODO

export default Continue;
