import { useState, useEffect } from "react";
import { Box, Tab } from "@mui/material";
import { PlayArrowRounded, ShuffleRounded, RssFeedRounded, ListRounded, SettingsRounded } from "@mui/icons-material";
import { TabPanel, TabList, TabContext } from "@mui/lab";
import Watch from "./Watch";
import Shuffle from "./Shuffle";
import Activity from "./Activity";
import List from "./List";
import Settings from "./Settings";
import { API, api } from "../../util/api";

const Landing = () => {
	const [tab, setTab] = useState("watch");
	const [series, setSeries] = useState<Awaited<ReturnType<API["getSeries"]["query"]>> | null>(null);
	const [viewings, setViewings] = useState<Awaited<ReturnType<API["getCurrentlyWatching"]["query"]>>["viewings"]>([]);

	useEffect(() => void api.getSeries.query().then(setSeries), []);
	useEffect(() => {
		void api.getCurrentlyWatching.query().then(function getRemainingViewings({ cursor, viewings }) {
			setViewings((existing) => {
				const newViewings = [...existing, ...viewings];
				const viewingsById = Object.fromEntries(newViewings.map((viewing) => [viewing.id, viewing]));
				return Object.values(viewingsById);
			});
			if (cursor) {
				void api.getCurrentlyWatching.query(cursor).then(getRemainingViewings);
			}
		});
	}, []);

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

	const logAndSetEpisode: API["logEpisode"]["mutate"] = (env) => {
		const promise = api.logEpisode.mutate(env);
		const updated = viewings.map((viewing) => {
			if (viewing.cursor === env.episodeId) {
				const currentIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === env.episodeId);
				if (currentIndex >= 0) {
					viewing.watchlist.episodes[currentIndex]._count.views++;
					const next = viewing.watchlist.episodes[currentIndex + 1];
					viewing.cursor = next?.id ?? null;
				}
			}
			return viewing;
		});
		setViewings(updated);
		return promise;
	};

	return (
		<Box sx={{ width: "100%", typography: "body1", boxSizing: "border-box" }}>
			<TabContext value={tab}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<TabList onChange={(_, newValue: string) => setTab(newValue)} aria-label="views" centered>
						<Tab label={<PlayArrowRounded aria-label="play" titleAccess="play" />} value="watch" />
						<Tab label={<ListRounded />} value="list" />
						<Tab label={<ShuffleRounded />} value="random" />
						<Tab label={<RssFeedRounded />} value="activity" />
						<Tab label={<SettingsRounded />} value="settings" />
					</TabList>
				</Box>
				<TabPanel value="watch">
					<Watch viewings={viewings} series={series} setCursor={setCursor} logEpisode={logAndSetEpisode} />
				</TabPanel>
				<TabPanel value="random">
					<Shuffle></Shuffle>
				</TabPanel>
				<TabPanel value="activity">
					<Activity></Activity>
				</TabPanel>
				<TabPanel value="list">
					<List></List>
				</TabPanel>
				<TabPanel value="settings">
					<Settings></Settings>
				</TabPanel>
			</TabContext>
		</Box>
	);
};

export default Landing;
