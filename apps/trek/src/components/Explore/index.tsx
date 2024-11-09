import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Container, Tab } from "@mui/material";
import { useState } from "react";
import { DebouncedTextField } from "../misc/DebouncedTextField";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Swiper as SwiperApi } from "swiper";
import "swiper/css";

const tabs = {
	episodes: 0,
	lists: 1,
	reviews: 2,
	viewers: 3,
};

export const Explore = () => {
	const [controlledSwiper, setControlledSwiper] = useState<SwiperApi | null>(null);
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<keyof typeof tabs>("episodes");

	return (
		<Container maxWidth="md">
			<DebouncedTextField
				placeholder="Search..."
				autoComplete="off"
				variant="standard"
				fullWidth
				onChange={(search) => setSearch(search.target.value)}
			/>
			<TabContext value={tab}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<TabList
						onChange={(_, newValue: string) => setTab(newValue as keyof typeof tabs)}
						aria-label="views"
						centered
					>
						<Tab
							label={
								<>
									{/*<VideoLibraryRounded />*/}
									Episodes
								</>
							}
							value="episodes"
						/>
						<Tab
							label={
								<>
									{/*<ListRounded />*/}
									Lists
								</>
							}
							value="lists"
						/>
						<Tab
							label={
								<>
									{/*<ReviewsRounded />*/}
									Reviews
								</>
							}
							value="reviews"
						/>
						<Tab
							label={
								<>
									{/*<PeopleRounded />*/}
									Viewers
								</>
							}
							value="viewers"
						/>
					</TabList>
				</Box>

				<Box sx={{ border: "dotted", width: "100%" }}>
					<Swiper
						controller={{ control: controlledSwiper }}
						spaceBetween={0}
						slidesPerView={1}
						defaultValue={2}
						onSlideChange={(...args: any[]) => console.log("slide change", ...args)}
						onSwiper={setControlledSwiper}
					>
						<SwiperSlide>Slide 1</SwiperSlide>
						<SwiperSlide>Slide 2</SwiperSlide>
						<SwiperSlide>Slide 3</SwiperSlide>
						<SwiperSlide>Slide 4</SwiperSlide>
					</Swiper>
				</Box>

				{/*<TabPanel value="episodes">*/}
				{/*	<>episodes {search}</>*/}
				{/*</TabPanel>*/}
				{/*<TabPanel value="lists">*/}
				{/*	<>lists {search}</>*/}
				{/*</TabPanel>*/}
				{/*<TabPanel value="reviews">*/}
				{/*	<>reviews {search}</>*/}
				{/*</TabPanel>*/}
				{/*<TabPanel value="viewers">*/}
				{/*	<>viewers {search}</>*/}
				{/*</TabPanel>*/}
			</TabContext>
		</Container>
	);
};
