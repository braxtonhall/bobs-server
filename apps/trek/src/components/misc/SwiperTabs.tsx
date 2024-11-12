import { useState, useCallback, JSX } from "react";
import { Box, Tab } from "@mui/material";
import { TabList, TabContext } from "@mui/lab";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperApi } from "swiper";
import type { Swiper as SwiperClass } from "swiper/types";

export type SwiperTabProps = {
	label: JSX.Element;
	content: JSX.Element;
};

export const SwiperTab = (_: SwiperTabProps) => <></>;

export const SwiperTabs = (props: { children: [...JSX.Element[], JSX.Element] }) => {
	const [swiper, setSwiper] = useState<SwiperApi | null>(null);
	const [tab, setTab] = useState<number>(0);

	const labels = props.children.map((child) => child.props.label);
	const panels = props.children.map((child) => child.props.content);

	const onChange = useCallback((_: unknown, newValue: number) => swiper?.slideTo(newValue), [swiper]);

	return (
		<Box marginTop="1em" width="100%">
			<Box marginBottom="1em">
				<TabContext value={tab}>
					<TabList onChange={onChange} aria-label="views" centered>
						{labels.map((label, index) => (
							<Tab label={label} value={index} key={index} />
						))}
					</TabList>
				</TabContext>
			</Box>
			<Box sx={{ width: "100%" }}>
				<Swiper
					spaceBetween={"20px"}
					slidesPerView={1}
					onSlideChange={(swiper: SwiperClass) => setTab(swiper.activeIndex)}
					style={{ maxWidth: "100%" }}
					onSwiper={setSwiper}
				>
					{panels.map((panel, index) => (
						<SwiperSlide key={index}>{panel}</SwiperSlide>
					))}
				</Swiper>
			</Box>
		</Box>
	);
};
