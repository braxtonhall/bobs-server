import { TabContext, TabList, TabPanel } from "@mui/lab";
import { alpha, Box, styled, Tab, TextField } from "@mui/material";
import { useState } from "react";
import { DebouncedTextField } from "../misc/DebouncedTextField";

export const Explore = () => {
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState("episodes");

	return (
		<>
			<Box sx={{ width: "100%", typography: "body1", boxSizing: "border-box" }}>
				<DebouncedTextField
					placeholder="Search..."
					autoComplete="off"
					variant="standard"
					fullWidth
					onChange={(search) => setSearch(search.target.value)}
				/>
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
						<>episodes {search}</>
					</TabPanel>
					<TabPanel value="lists">
						<>lists {search}</>
					</TabPanel>
					<TabPanel value="reviews">
						<>reviews {search}</>
					</TabPanel>
					<TabPanel value="viewers">
						<>viewers {search}</>
					</TabPanel>
				</TabContext>
			</Box>
		</>
	);
};
