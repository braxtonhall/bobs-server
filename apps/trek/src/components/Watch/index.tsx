import { PlayCircleOutlineRounded, ShuffleRounded } from "@mui/icons-material";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { SwiperTabs } from "../misc/SwiperTabs";

const Watch = () => (
	<SwiperTabs
		tabs={[
			{
				icon: <PlayCircleOutlineRounded aria-label="play" titleAccess="play" />,
				content: <Continue />,
			},
			{
				icon: <ShuffleRounded aria-label="random" titleAccess="random" />,
				content: <Shuffle />,
			},
		]}
	/>
);

export default Watch;
