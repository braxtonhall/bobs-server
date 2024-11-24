import { PlayCircleOutlineRounded, ShuffleRounded } from "@mui/icons-material";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { SwiperTabs } from "../misc/SwiperTabs";
import { useContent } from "../../util/useContent";

const Watch = () => {
	const { episodes, series } = useContent();

	return (
		<SwiperTabs
			tabs={[
				{
					icon: <PlayCircleOutlineRounded aria-label="play" titleAccess="play" />,
					content: <Continue episodes={episodes} series={series} />,
				},
				{
					icon: <ShuffleRounded aria-label="random" titleAccess="random" />,
					content: <Shuffle />,
				},
			]}
		/>
	);
};

export default Watch;
