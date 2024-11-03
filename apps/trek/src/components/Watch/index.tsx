import { useState, useEffect } from "react";
import { Box, Container, Tab } from "@mui/material";
import { PlayArrowRounded, ShuffleRounded } from "@mui/icons-material";
import { TabPanel, TabList, TabContext } from "@mui/lab";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { API, api } from "../../util/api";
import { Episode } from "./types";
import { Outlet } from "react-router-dom";

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
		<Container maxWidth="md" sx={{ typography: "body1" }}>
			<TabContext value={tab}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<TabList onChange={(_, newValue: string) => setTab(newValue)} aria-label="views" centered>
						<Tab label={<PlayArrowRounded aria-label="play" titleAccess="play" />} value="watch" />
						<Tab label={<ShuffleRounded />} value="random" />
					</TabList>
				</Box>
				<TabPanel value="watch">
					<Continue episodes={episodes} series={series} setEpisodes={setEpisodes} />
				</TabPanel>
				<TabPanel value="random">
					<Shuffle />
				</TabPanel>
			</TabContext>
		</Container>
	);
};

export default Landing;
