import { useState, useCallback, JSX, useRef } from "react";
import { Box, styled, Tab, useMediaQuery } from "@mui/material";
import { TabList, TabContext, TabPanel } from "@mui/lab";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperApi } from "swiper";
import type { Swiper as SwiperClass } from "swiper/types";
import "swiper/css";
import { SpaceFillingBox, SpaceFillingBoxContainer } from "./SpaceFillingBox";

const StyledTabPanel = styled(TabPanel)(({ theme }) => ({
	paddingLeft: 0,
	paddingRight: 0,
}));

const StyledSwiper = styled(Swiper)(({ theme }) => ({
	maxWidth: "100%",
	zIndex: "unset",
	"& .swiper-wrapper": {
		zIndex: "unset",
	},
}));

export type TabTransport = {
	label: JSX.Element;
	content: JSX.Element;
};

export const SwiperTabs = (props: { tabs: [...TabTransport[], TabTransport] }) => {
	const touchScreen = useMediaQuery("(hover: none)");
	const swiper = useRef<SwiperApi | null>(null);
	const [tab, setTab] = useState<number>(0);
	const onChange = useCallback(
		(_: unknown, newValue: number) => {
			touchScreen ? swiper.current?.slideTo(newValue) : setTab(newValue);
		},
		[touchScreen],
	);

	return (
		<SpaceFillingBoxContainer flexDirection="column">
			<TabContext value={tab}>
				<Box>
					<TabList onChange={onChange} aria-label="views" centered>
						{props.tabs.map(({ label }, index) => (
							<Tab label={label} value={index} key={index} />
						))}
					</TabList>
				</Box>
				<SpaceFillingBox width="100%" display={touchScreen ? "flex" : "unset"}>
					{touchScreen ? (
						<StyledSwiper
							spaceBetween="1em"
							slidesPerView={1}
							onSlideChange={(swiper: SwiperClass) => setTab(swiper.activeIndex)}
							onSwiper={(newSwiper: SwiperApi) => {
								swiper.current = newSwiper;
								onChange(void "unused", tab);
							}}
						>
							{props.tabs.map(({ content }, index) => (
								<SwiperSlide key={index}>
									<Box
										sx={{
											width: "100%",
											height: "100%",
											overflow: "auto",
										}}
									>
										<Box marginTop="1em">{content}</Box>
									</Box>
								</SwiperSlide>
							))}
						</StyledSwiper>
					) : (
						props.tabs.map(({ content }, index) => (
							<StyledTabPanel key={index} value={index}>
								{content}
							</StyledTabPanel>
						))
					)}
				</SpaceFillingBox>
			</TabContext>
		</SpaceFillingBoxContainer>
	);
};
