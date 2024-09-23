import { useState, useEffect, useMemo } from "react";
import { Box, Tab } from "@mui/material";
import { PlayArrowRounded, ShuffleRounded, RssFeedRounded, ListRounded, SettingsRounded } from "@mui/icons-material";
import { TabPanel, TabList, TabContext } from "@mui/lab";
import Watch from "./Watch";
import Shuffle from "./Shuffle";
import Activity from "./Activity";
import List from "./List";
import Settings from "./Settings";
import { Content, Episode, UserSettings, Search } from "../types";
import { resolveEpisodes } from "../util/resolveEpisodes";

const Landing = () => {
	const [tab, setTab] = useState("watch");
	const [content, setContent] = useState<Content | null>(null);
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [search, setSearch] = useState<Search | null>(null);

	const episodes = useMemo(
		(): Episode[] | null => (content && search ? resolveEpisodes(content.episodes, search) : null),
		[content, search],
	);

	useEffect(() => {
		(async () => {
			await new Promise((resolve) => setTimeout(resolve, 3_000));
			setSettings({} as never);
			setSearch({} as never);
			setContent({
				series: { TOS: { id: "TOS", name: "The Original Series" } },
				episodes: [
					{
						views: [],
						name: "The Man Trap",
						abbreviation: null,
						runtime: 50,
						release: new Date("1966-05-10"),
						starDate: null,
						season: 1,
						production: 1,
						description: "",
						seriesId: "TOS",
						bobsSort: 1,
					},
				],
			});
		})();
	}, []);

	return (
		<Box sx={{ width: "100%", typography: "body1" }}>
			<TabContext value={tab}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<TabList onChange={(_, newValue: string) => setTab(newValue)} aria-label="views" centered>
						<Tab label={<PlayArrowRounded aria-label="play" titleAccess="play" />} value="watch" />
						<Tab label={<ShuffleRounded />} value="random" />
						<Tab label={<RssFeedRounded />} value="activity" />
						<Tab label={<ListRounded />} value="list" />
						<Tab label={<SettingsRounded />} value="settings" />
					</TabList>
				</Box>
				<TabPanel value="watch">
					<Watch episodes={episodes} settings={settings}></Watch>
				</TabPanel>
				<TabPanel value="random">
					<Shuffle settings={settings}></Shuffle>
				</TabPanel>
				<TabPanel value="activity">
					<Activity settings={settings}></Activity>
				</TabPanel>
				<TabPanel value="list">
					<List
						episodes={episodes}
						search={search}
						setSearch={setSearch}
						series={content?.series ?? null}
						settings={settings}
					></List>
				</TabPanel>
				<TabPanel value="settings">
					<Settings settings={settings} setSettings={setSettings}></Settings>
				</TabPanel>
			</TabContext>
		</Box>
	);
};

export default Landing;
