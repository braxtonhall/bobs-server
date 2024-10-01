import { useState, useEffect } from "react";
import { Box, Tab } from "@mui/material";
import { PlayArrowRounded, ShuffleRounded, RssFeedRounded, ListRounded, SettingsRounded } from "@mui/icons-material";
import { TabPanel, TabList, TabContext } from "@mui/lab";
import Watch from "./Watch";
import Shuffle from "./Shuffle";
import Activity from "./Activity";
import List from "./List";
import Settings from "./Settings";
import {
	getCurrentlyWatching,
	SeriesCollection,
	getSeries,
	CurrentlyWatching,
	updateCursor,
	logEpisode,
} from "../../util/api";

const Landing = () => {
	const [tab, setTab] = useState("watch");
	const [series, setSeries] = useState<SeriesCollection | null>(null);
	const [currently, setCurrently] = useState<CurrentlyWatching | null>(null);

	useEffect(
		() =>
			void Promise.all([getCurrentlyWatching(), getSeries()]).then(([watching, series]) => {
				setSeries(series);
				setCurrently(watching);
			}),
		[],
	);

	const setCursor = (id: string | null) => {
		if (currently) {
			void updateCursor(id);
			setCurrently({
				...currently,
				current: id ? { id } : null,
			});
		}
	};

	const logAndSetEpisode: typeof logEpisode = (env) => {
		void logEpisode(env);
		if (currently?.current?.id === env.episodeId) {
			const currentIndex = currently.watching?.episodes.findIndex(({ id }) => id === env.episodeId);
			const nextIndex = typeof currentIndex === "number" ? currentIndex + 1 : -1;
			const next = currently.watching?.episodes[nextIndex];
			setCurrently({
				...currently,
				current: next ? { id: next.id } : null,
			});
		}
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
					<Watch currently={currently} series={series} setCursor={setCursor} logEpisode={logAndSetEpisode} />
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
