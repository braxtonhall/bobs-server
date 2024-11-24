import { Box, CircularProgress } from "@mui/material";
import { api } from "../../../util/api";
import { Viewing } from "./Viewing";
import { Episode, SeriesCollection } from "../types";
import { useCallback, useMemo } from "react";
import { mergeViewingWithContent } from "./mergeViewingWithContent";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { MutationContext } from "./MutationContext";
import { OnScreenWatcher } from "../../misc/OnScreenWatcher";
import { curry } from "../../../util/curry";
import { ViewingControlsContext } from "../../../contexts/ViewingControlsContext";

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

	const removeFromInProgress = useCallback(
		(id: string) => {
			for (const page of data?.pages ?? []) {
				const index = page.viewings.findIndex((element) => element.id === id);
				if (index >= 0) {
					page.viewings.splice(index, 1);
				}
			}
			const index = viewings.findIndex((element) => element.id === id);
			if (index >= 0) {
				return viewings.splice(index, 1);
			}
			return [];
		},
		[data, viewings],
	);

	const { mutate: pause } = useMutation({
		onMutate: (id: string) => {
			const removed = removeFromInProgress(id);
			// TODO add to the pause list
		},
		mutationFn: api.pauseViewing.mutate,
	});
	const { mutate: stop } = useMutation({
		onMutate: removeFromInProgress,
		mutationFn: api.stopViewing.mutate,
	});
	const { mutate: resume } = useMutation({
		onMutate: (id: string) => {
			// TODO remove from paused list
			// TODO add to in progress list
		},
		mutationFn: api.resumeViewing.mutate,
	});
	const { mutate: complete } = useMutation({
		onMutate: (id: string) => {
			const removed = removeFromInProgress(id);
			// TODO add to the complete list
		},
		mutationFn: api.completeViewing.mutate,
	});

	const decoratedViewings = useMemo(
		() =>
			!!viewings.length &&
			series &&
			episodes &&
			viewings.map((viewing) => mergeViewingWithContent({ viewing, series, episodes })),
		[viewings, series, episodes],
	);

	return (
		<MutationContext.Provider value={{ logEpisode, setCursor }}>
			<Box position="relative" width="100%" boxSizing="border-box">
				{!hasNextPage && !isFetching && !viewings.length ? (
					<ContinueInactive />
				) : (
					decoratedViewings &&
					decoratedViewings.map((viewing) => (
						<ViewingControlsContext.Provider
							key={viewing.id}
							value={{
								stop: curry(stop, viewing.id),
								pause: curry(pause, viewing.id),
								complete: curry(complete, viewing.id),
								resume: curry(resume, viewing.id),
							}}
						>
							<Viewing key={viewing.id} viewing={viewing} />
						</ViewingControlsContext.Provider>
					))
				)}

				{hasNextPage &&
					(isFetching ? (
						<Box display="flex" justifyContent="center">
							<CircularProgress />
						</Box>
					) : (
						<OnScreenWatcher onScreen={fetchNextPage} />
					))}
			</Box>
		</MutationContext.Provider>
	);
};

const ContinueInactive = () => <p>You are not watching anything at the moment</p>; // TODO

export default Continue;
