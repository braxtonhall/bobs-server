import React, { useState, useEffect, useCallback } from "react";
import { Box, Container, Tab, styled } from "@mui/material";
import { PlayArrowRounded, ShuffleRounded } from "@mui/icons-material";
import { TabList, TabContext } from "@mui/lab";
import Continue from "./Continue";
import Shuffle from "./Shuffle";
import { API, api } from "../../util/api";
import { Episode } from "./types";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperApi } from "swiper";
import type { Swiper as SwiperClass } from "swiper/types";

const tabs = ["watch", "random"] as const;

const Watch = () => {
	const [swiper, setSwiper] = useState<SwiperApi | null>(null);
	const [tab, setTab] = useState<(typeof tabs)[number]>("watch");
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

	const onChange = useCallback(
		(_: unknown, newValue: string) => swiper?.slideTo(tabs.indexOf(newValue as (typeof tabs)[number])),
		[swiper],
	);

	return (
		<Container maxWidth="md">
			<Box marginTop="1em" width="100%">
				<Box marginBottom="1em">
					<TabContext value={tab}>
						<TabList onChange={onChange} aria-label="views" centered>
							<Tab label={<PlayArrowRounded aria-label="play" titleAccess="play" />} value="watch" />
							<Tab label={<ShuffleRounded aria-label="random" titleAccess="random" />} value="random" />
						</TabList>
					</TabContext>
				</Box>
				<Box sx={{ width: "100%" }}>
					<Swiper
						spaceBetween={"20px"}
						slidesPerView={1}
						onSlideChange={(swiper: SwiperClass) => setTab(tabs[swiper.activeIndex])}
						style={{ maxWidth: "100%" }}
						onSwiper={setSwiper}
					>
						<SwiperSlide>
							<Continue episodes={episodes} series={series} setEpisodes={setEpisodes} />
						</SwiperSlide>
						<SwiperSlide>
							<Shuffle />
						</SwiperSlide>
					</Swiper>
				</Box>
			</Box>
		</Container>
	);
};

export default Watch;
