import { PlayArrowRounded, ShuffleRounded } from "@mui/icons-material";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { api } from "../../util/api";
import { SwiperTabs } from "../misc/SwiperTabs";
import { Container } from "@mui/material";
import { useQueries } from "@tanstack/react-query";

const Watch = () => {
	const [{ data: series = null }, { data: episodes = null }] = useQueries({
		queries: [
			{
				queryKey: ["series"],
				queryFn: () => api.getSeries.query(),
			},
			{
				queryKey: ["episodes"],
				queryFn: () =>
					api.getEpisodes
						.query()
						.then((episodes) => Object.fromEntries(episodes.map((episode) => [episode.id, episode]))),
			},
		],
	});

	return (
		<SwiperTabs
			tabs={[
				{
					label: <PlayArrowRounded aria-label="play" titleAccess="play" />,
					content: (
						<Container maxWidth="md">
							<Continue episodes={episodes} series={series} />
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
