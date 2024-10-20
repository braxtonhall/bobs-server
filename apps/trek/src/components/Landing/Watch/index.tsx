import { Box, CircularProgress, Fade } from "@mui/material";
import { api, API } from "../../../util/api";
import { Viewing } from "./Viewing";
import { Episode, SeriesCollection } from "./types";
import { useEffect, useState } from "react";

interface WatchProps {
	series: SeriesCollection | null;
	episodes: Record<string, Episode> | null;
	setEpisodes: (episodes: Record<string, Episode>) => void;
}

const Watch = (props: WatchProps) => {
	const [viewings, setViewings] = useState<Awaited<ReturnType<API["getCurrentlyWatching"]["query"]>>["viewings"]>([]);
	useEffect(() => {
		void api.getCurrentlyWatching.query().then(function getRemainingViewings({ cursor, viewings }) {
			setViewings((existing) => {
				const newViewings = [...existing, ...viewings];
				const viewingsById = Object.fromEntries(newViewings.map((viewing) => [viewing.id, viewing]));
				return Object.values(viewingsById);
			});
			// TODO this should only happen at the bottom of the page
			if (cursor) {
				void api.getCurrentlyWatching.query(cursor).then(getRemainingViewings);
			}
		});
	}, []);

	// TODO https://react.dev/reference/react/useCallback
	const logAndSetEpisode: API["logEpisode"]["mutate"] = (env) => {
		const promise = api.logEpisode.mutate(env);
		const updated = viewings.map((viewing) => {
			if (viewing.cursor === env.episodeId) {
				const currentIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === env.episodeId);
				if (currentIndex >= 0) {
					const next = viewing.watchlist.episodes[currentIndex + 1];
					viewing.cursor = next?.id ?? null;
				}
			}
			return viewing;
		});
		setViewings(updated);
		if (props.episodes) {
			props.episodes[env.episodeId]._count.views++;
			props.setEpisodes(props.episodes);
		}
		return promise;
	};

	const setCursor: API["updateCursor"]["mutate"] = (env) => {
		const promise = api.updateCursor.mutate(env);
		const updated = viewings.map((viewing) => {
			if (viewing.id === env.viewingId) {
				return {
					...viewing,
					cursor: env.episodeId,
				};
			} else {
				return viewing;
			}
		});
		setViewings(updated);
		return promise;
	};

	return (
		<>
			<Box position="relative" width="100%" boxSizing="border-box">
				<Fade in={viewings.length === 0} unmountOnExit>
					<Box
						position="absolute"
						height="100%"
						width="100%"
						boxSizing="border-box"
						display="flex"
						justifyContent="center"
						alignItems="center"
						bgcolor="white"
					>
						<CircularProgress />
					</Box>
				</Fade>
				{viewings.length && props.series && props.episodes ? (
					viewings.map(
						((series, episodes) => (viewing) => (
							<Viewing
								key={viewing.id}
								viewing={viewing}
								series={series}
								setCursor={setCursor}
								logEpisode={logAndSetEpisode}
								episodes={episodes}
							/>
						))(props.series, props.episodes),
					)
				) : (
					<WatchInactive />
				)}
			</Box>
		</>
	);
};

const WatchInactive = () => <p>You are not watching anything at the moment</p>; // TODO

export default Watch;