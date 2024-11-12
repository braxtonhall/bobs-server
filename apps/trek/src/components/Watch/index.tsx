import React, { useState, useEffect } from "react";
import { PlayArrowRounded, ShuffleRounded } from "@mui/icons-material";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { API, api } from "../../util/api";
import { Episode } from "./types";
import { SwiperTabs } from "../misc/SwiperTabs";
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
		<SwiperTabs
			tabs={[
				{
					label: <PlayArrowRounded aria-label="play" titleAccess="play" />,
					content: (
						<Container maxWidth="md">
							<Continue episodes={episodes} series={series} setEpisodes={setEpisodes} />
						</Container>
					),
				},
				{
					label: <ShuffleRounded aria-label="random" titleAccess="random" />,
					content: (
						<Container maxWidth="md">
							<Shuffle />
						</Container>
					),
				},
			]}
		/>
	);
};

export default Watch;
