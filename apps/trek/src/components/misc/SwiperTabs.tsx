import { useState, useCallback, JSX, useRef } from "react";
import { Box, styled, Tab } from "@mui/material";
import { TabList, TabContext } from "@mui/lab";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperApi } from "swiper";
import type { Swiper as SwiperClass } from "swiper/types";
import "swiper/css";

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

export const SwiperTabs = (props: { tabs: TabTransport[] }) => {
	const swiper = useRef<SwiperApi | null>(null);
	const [tab, setTab] = useState<number>(0);
	const onChange = useCallback((_: unknown, newValue: number) => swiper.current?.slideTo(newValue), []);

	return (
		<Box width="100%">
			<Box marginBottom="1em">
				<TabContext value={tab}>
					<TabList onChange={onChange} aria-label="views" centered>
						{props.tabs.map(({ label }, index) => (
							<Tab label={label} value={index} key={index} />
						))}
					</TabList>
				</TabContext>
			</Box>
			<Box sx={{ width: "100%" }}>
				<StyledSwiper
					spaceBetween="1em"
					slidesPerView={1}
					onSlideChange={(swiper: SwiperClass) => setTab(swiper.activeIndex)}
					style={{ maxWidth: "100%" }}
					onSwiper={(newSwiper: SwiperApi) => void (swiper.current = newSwiper)}
				>
					{props.tabs.map(({ content }, index) => (
						<SwiperSlide key={index}>{content}</SwiperSlide>
					))}
				</StyledSwiper>
			</Box>
		</Box>
	);
};
