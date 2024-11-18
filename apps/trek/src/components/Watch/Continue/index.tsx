import { Box, Button } from "@mui/material";
import { api } from "../../../util/api";
import { Viewing } from "./Viewing";
import { Episode, SeriesCollection } from "../types";
import { useMemo } from "react";
import { mergeViewingWithContent } from "./mergeViewingWithContent";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { MutationContext } from "./MutationContext";

interface ContinueProps {
	series: SeriesCollection | null;
	episodes: Record<string, Episode> | null;
}

const Continue = ({ series, episodes }: ContinueProps) => {
	// TODO are these useful? {error, isFetchingNextPage, status}
	const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
		queryKey: ["continue"],
		queryFn: ({ pageParam }) => api.getCurrentlyWatching.query(pageParam),
		initialPageParam: undefined as undefined | string,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
	const viewings = useMemo(() => data?.pages.flatMap((page) => page.viewings) ?? [], [data]);
	const { mutate: logEpisode } = useMutation({
		mutationFn: api.logEpisode.mutate,
		onMutate: (env) => {
			viewings.forEach((viewing) => {
				if (viewing.cursor === env.episodeId) {
					const currentIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === env.episodeId);
					if (currentIndex >= 0) {
						const next = viewing.watchlist.episodes[currentIndex + 1];
						viewing.cursor = next?.id ?? null;
					}
				}
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
			}
		},
	});

	const { mutate: setCursor } = useMutation({
		mutationFn: api.updateCursor.mutate,
		onMutate: (env) =>
			viewings.forEach((viewing) => {
				if (viewing.id === env.viewingId) {
					viewing.cursor = env.episodeId;
				}
			}),
	});

	return (
		<MutationContext.Provider value={{ logEpisode, setCursor }}>
			<Box position="relative" width="100%" boxSizing="border-box">
				{!hasNextPage && !viewings.length ? (
					<ContinueInactive />
				) : viewings.length && series && episodes ? (
					viewings.map(
						((series, episodes) => (viewing) => (
							<Viewing
								key={viewing.id}
								viewing={mergeViewingWithContent({ viewing, series, episodes })}
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
		</MutationContext.Provider>
	);
};

const ContinueInactive = () => <p>You are not watching anything at the moment</p>; // TODO

export default Continue;
