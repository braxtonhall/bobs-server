import { useState, useEffect } from "react";
import { Box, Container, Tab, styled } from "@mui/material";
import { PlayArrowRounded, ShuffleRounded } from "@mui/icons-material";
import { TabPanel, TabList, TabContext } from "@mui/lab";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { API, api } from "../../util/api";
import { Episode } from "./types";

const StyledTabPanel = styled(TabPanel)(({ theme }) => ({
	paddingLeft: 0,
	paddingRight: 0,
}));

const Watch = () => {
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
		<Container maxWidth="md">
			<TabContext value={tab}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<TabList onChange={(_, newValue: string) => setTab(newValue)} aria-label="views" centered>
						<Tab label={<PlayArrowRounded aria-label="play" titleAccess="play" />} value="watch" />
						<Tab label={<ShuffleRounded />} value="random" />
					</TabList>
				</Box>
				<StyledTabPanel value="watch">
					<Continue episodes={episodes} series={series} setEpisodes={setEpisodes} />
				</StyledTabPanel>
				<StyledTabPanel value="random">
					<Shuffle />
				</StyledTabPanel>
			</TabContext>
		</Container>
	);
};

export default Watch;

// TODO Beneath is the swiper version. it has some spacing an zIndex problems, but I think it can be fixed...
// TODO also need to make the panels... virtual? not sure what the word is. they need to get unmounted when not seen

// import React, { useState, useEffect, useCallback } from "react";
// import { Box, Container, Tab, styled } from "@mui/material";
// import { PlayArrowRounded, ShuffleRounded } from "@mui/icons-material";
// import { TabPanel, TabList, TabContext } from "@mui/lab";
// import Continue from "./Continue";
// import Shuffle from "./Shuffle";
// import { API, api } from "../../util/api";
// import { Episode } from "./types";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Swiper as SwiperApi } from "swiper";
// import type { Swiper as SwiperClass } from "swiper/types";
//
// const StyledTabPanel = styled(TabPanel)(({ theme }) => ({
// 	paddingLeft: 0,
// 	paddingRight: 0,
// }));
//
// const tabs = ["watch", "random"] as const;
//
// const Watch = () => {
// 	const [swiper, setSwiper] = useState<SwiperApi | null>(null);
// 	const [tab, setTab] = useState<(typeof tabs)[number]>("watch");
// 	const [episodes, setEpisodes] = useState<Record<string, Episode> | null>(null);
// 	const [series, setSeries] = useState<Awaited<ReturnType<API["getSeries"]["query"]>> | null>(null);
//
// 	useEffect(() => void api.getSeries.query().then(setSeries), []);
// 	useEffect(
// 		() =>
// 			void api.getEpisodes
// 				.query()
// 				.then((episodes) => Object.fromEntries(episodes.map((episode) => [episode.id, episode])))
// 				.then(setEpisodes),
// 		[],
// 	);
//
// 	const onChange = useCallback(
// 		(_: unknown, newValue: string) => swiper?.slideTo(tabs.indexOf(newValue as (typeof tabs)[number])),
// 		[swiper],
// 	);
//
// 	return (
// 		<Container maxWidth="md">
// 			<Box marginTop="1em" width="100%">
// 				<TabContext value={tab}>
// 					<TabList onChange={onChange} aria-label="views" centered>
// 						<Tab label={<PlayArrowRounded aria-label="play" titleAccess="play" />} value="watch" />
// 						<Tab label={<ShuffleRounded aria-label="random" titleAccess="random" />} value="random" />
// 					</TabList>
// 				</TabContext>
// 				<Box sx={{ width: "100%" }}>
// 					<Swiper
// 						spaceBetween={"20px"}
// 						slidesPerView={1}
// 						onSlideChange={(swiper: SwiperClass) => setTab(tabs[swiper.activeIndex])}
// 						style={{ maxWidth: "100%" }}
// 						onSwiper={setSwiper}
// 					>
// 						<SwiperSlide>
// 							<Continue episodes={episodes} series={series} setEpisodes={setEpisodes} />
// 						</SwiperSlide>
// 						<SwiperSlide>
// 							<Shuffle />
// 						</SwiperSlide>
// 					</Swiper>
// 				</Box>
// 			</Box>
// 		</Container>
// 	);
//
// 	// return (
// 	// 	<Container maxWidth="md">
// 	// 		<TabContext value={tab}>
// 	// 			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
// 	// 				<TabList onChange={(_, newValue: string) => setTab(newValue)} aria-label="views" centered>
// 	// 					<Tab label={<PlayArrowRounded aria-label="play" titleAccess="play" />} value="watch" />
// 	// 					<Tab label={<ShuffleRounded aria-label="random" titleAccess="random" />} value="random" />
// 	// 				</TabList>
// 	// 			</Box>
// 	// 			<StyledTabPanel value="watch">
// 	// 				<Continue episodes={episodes} series={series} setEpisodes={setEpisodes} />
// 	// 			</StyledTabPanel>
// 	// 			<StyledTabPanel value="random">
// 	// 				<Shuffle />
// 	// 			</StyledTabPanel>
// 	// 		</TabContext>
// 	// 	</Container>
// 	// );
// };
//
// export default Watch;
