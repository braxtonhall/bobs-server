import { useState, useCallback, JSX, useRef } from "react";
import { Box, styled, Tab, useMediaQuery } from "@mui/material";
import { TabList, TabContext, TabPanel } from "@mui/lab";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperApi } from "swiper";
import type { Swiper as SwiperClass } from "swiper/types";
import "swiper/css";

const StyledTabPanel = styled(TabPanel)(({ theme }) => ({
	paddingLeft: 0,
	paddingRight: 0,
}));

const StyledSwiper = styled(Swiper)(({ theme }) => ({
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
		<Box width="100%" height="100%" position="relative">
			<Box height="100%" width="100%" display="flex" position="absolute" flexDirection="column">
				<TabContext value={tab}>
					<Box>
						<TabList onChange={onChange} aria-label="views" centered>
							{props.tabs.map(({ label }, index) => (
								<Tab label={label} value={index} key={index} />
							))}
						</TabList>
					</Box>
					<Box
						sx={{
							width: "100%",
							flex: 1,
							display: touchScreen ? "flex" : "unset",
							minHeight: "0px",
						}}
					>
						{touchScreen ? (
							<StyledSwiper
								spaceBetween="1em"
								slidesPerView={1}
								onSlideChange={(swiper: SwiperClass) => setTab(swiper.activeIndex)}
								style={{ maxWidth: "100%" }}
								onSwiper={(newSwiper: SwiperApi) => void (swiper.current = newSwiper)}
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
					</Box>
				</TabContext>
			</Box>
		</Box>
	);
};
