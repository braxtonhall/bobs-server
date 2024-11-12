import { TabContext, TabList } from "@mui/lab";
import { Box, Container, Tab } from "@mui/material";
import React, { useCallback, useState } from "react";
import { DebouncedTextField } from "../misc/DebouncedTextField";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperApi } from "swiper";
import type { Swiper as SwiperClass } from "swiper/types";
import "swiper/css";
import { ListRounded, PeopleRounded, ReviewsRounded, VideoLibraryRounded } from "@mui/icons-material";

const tabs = ["episodes", "lists", "reviews", "viewers"] as const;

export const Explore = () => {
	const [swiper, setSwiper] = useState<SwiperApi | null>(null);
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<(typeof tabs)[number]>("episodes");

	const onChange = useCallback(
		(_: unknown, newValue: string) => swiper?.slideTo(tabs.indexOf(newValue as (typeof tabs)[number])),
		[swiper],
	);

	return (
		<Container maxWidth="md">
			<Box marginTop="1em" width="100%">
				<DebouncedTextField
					placeholder="Search..."
					autoComplete="off"
					variant="standard"
					fullWidth
					onChange={(search) => setSearch(search.target.value)}
				/>
				<Box marginBottom="1em">
					<TabContext value={tab}>
						<Box width="100%" sx={{ borderBottom: 1, borderColor: "divider" }}>
							<TabList onChange={onChange} aria-label="views" centered>
								<Tab
									label={
										<>
											<VideoLibraryRounded />
											Episodes
										</>
									}
									value="episodes"
								/>
								<Tab
									label={
										<>
											<ListRounded />
											Lists
										</>
									}
									value="lists"
								/>
								<Tab
									label={
										<>
											<ReviewsRounded />
											Reviews
										</>
									}
									value="reviews"
								/>
								<Tab
									label={
										<>
											<PeopleRounded />
											Viewers
										</>
									}
									value="viewers"
								/>
							</TabList>
						</Box>
					</TabContext>
				</Box>
				<Box sx={{ display: "grid", border: "dotted", width: "100%", boxSizing: "border-box" }}>
					<Swiper
						spaceBetween={0}
						slidesPerView={1}
						onSlideChange={(swiper: SwiperClass) => setTab(tabs[swiper.activeIndex])}
						style={{ maxWidth: "100%" }}
						onSwiper={setSwiper}
					>
						<SwiperSlide>
							{search ? `SEARCHING FOR "${search}" IN EPISODES` : `EXPLORING EPISODES`}
						</SwiperSlide>
						<SwiperSlide>{search ? `SEARCHING FOR "${search}" IN LISTS` : `EXPLORING LISTS`}</SwiperSlide>
						<SwiperSlide>
							{search ? `SEARCHING FOR "${search}" IN REVIEWS` : `EXPLORING REVIEWS`}
						</SwiperSlide>
						<SwiperSlide>
							{search ? `SEARCHING FOR "${search}" IN VIEWERS` : `EXPLORING VIEWERS`}
						</SwiperSlide>
					</Swiper>
				</Box>
			</Box>
		</Container>
	);
};
