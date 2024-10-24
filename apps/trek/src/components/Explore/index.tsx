import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab } from "@mui/material";
import { useState } from "react";

export const Explore = (props: { search: string }) => {
	const [tab, setTab] = useState("episodes");

	return (
		<>
			<Box sx={{ width: "100%", typography: "body1", boxSizing: "border-box" }}>
				<TabContext value={tab}>
					<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
						<TabList onChange={(_, newValue: string) => setTab(newValue)} aria-label="views" centered>
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
					<TabPanel value="episodes">
						<>episodes {props.search}</>
					</TabPanel>
					<TabPanel value="lists">
						<>lists {props.search}</>
					</TabPanel>
					<TabPanel value="reviews">
						<>reviews {props.search}</>
					</TabPanel>
					<TabPanel value="viewers">
						<>viewers {props.search}</>
					</TabPanel>
				</TabContext>
			</Box>
		</>
	);
};
