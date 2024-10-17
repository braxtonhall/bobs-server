import { useState, useEffect, useMemo } from "react";
import { Box, Tab } from "@mui/material";
import { PlayArrowRounded, ShuffleRounded, RssFeedRounded, ListRounded, SettingsRounded } from "@mui/icons-material";
import { TabPanel, TabList, TabContext } from "@mui/lab";
import Watch from "./Watch";
import Shuffle from "./Shuffle";
import Activity from "./Activity";
import List from "./List";
import Settings from "./Settings";
import { API, api } from "../../util/api";
import { Episode } from "./Watch/types";

const Landing = () => {
	const [tab, setTab] = useState("watch");
	const [episodes, setEpisodes] = useState<Record<string, Episode> | null>(null);
	const [series, setSeries] = useState<Awaited<ReturnType<API["getSeries"]["query"]>> | null>(null);

	useEffect(() => void api.getSeries.query().then(setSeries), []);
	useEffect(
		() =>
			void api.getEpisodes
				.query()
				.then((episodes) => Object.fromEntries(episodes.map((episode) => [episode.id, episode])))
				.then(setEpisodes),
		[],
	);

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
					<Watch episodes={episodes} series={series} setEpisodes={setEpisodes} />
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
