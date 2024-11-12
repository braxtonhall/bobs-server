import React, { useState, useEffect } from "react";
import { PlayArrowRounded, ShuffleRounded } from "@mui/icons-material";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { API, api } from "../../util/api";
import { Episode } from "./types";
import { SwiperTab, SwiperTabs } from "../misc/SwiperTabs";
import { Container } from "@mui/material";

const Watch = () => {
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
		<Container maxWidth="md">
			<SwiperTabs>
				<SwiperTab
					label={<PlayArrowRounded aria-label="play" titleAccess="play" />}
					content={<Continue episodes={episodes} series={series} setEpisodes={setEpisodes} />}
				/>
				<SwiperTab label={<ShuffleRounded aria-label="random" titleAccess="random" />} content={<Shuffle />} />
			</SwiperTabs>
		</Container>
	);
};

export default Watch;
