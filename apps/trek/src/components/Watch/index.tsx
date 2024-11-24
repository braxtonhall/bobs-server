import { PlayCircleOutlineRounded, ShuffleRounded } from "@mui/icons-material";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { SwiperTabs } from "../misc/SwiperTabs";
import { Container } from "@mui/material";
import { useContent } from "../../util/useContent";

const Watch = () => {
	const { episodes, series } = useContent();

	return (
		<SwiperTabs
			tabs={[
				{
					icon: <PlayCircleOutlineRounded aria-label="play" titleAccess="play" />,
					content: (
						<Container maxWidth="md">
							<Continue episodes={episodes} series={series} />
						</Container>
					),
				},
				{
					icon: <ShuffleRounded aria-label="random" titleAccess="random" />,
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
