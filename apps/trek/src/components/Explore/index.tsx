import { Box, Container } from "@mui/material";
import { useState } from "react";
import { DebouncedTextField } from "../misc/DebouncedTextField";
import { ListRounded, PeopleRounded, ReviewsRounded, VideoLibraryRounded } from "@mui/icons-material";
import { SwiperTabs } from "../misc/SwiperTabs";

export const Explore = () => {
	const [search, setSearch] = useState("");

	return (
		<Box marginTop="1em" width="100%">
			<Container maxWidth="md">
				<DebouncedTextField
					placeholder="Search…"
					autoComplete="off"
					variant="standard"
					fullWidth
					onChange={(search) => setSearch(search.target.value)}
				/>
			</Container>
			<SwiperTabs
				tabs={[
					{
						label: (
							<>
								<VideoLibraryRounded />
								Episodes
							</>
						),
						content: (
							<Container maxWidth="md">
								{search ? `SEARCHING FOR "${search}" IN EPISODES` : `EXPLORING EPISODES`}
							</Container>
						),
					},
					{
						label: (
							<>
								<ListRounded />
								Lists
							</>
						),
						content: (
							<Container maxWidth="md">
								{search ? `SEARCHING FOR "${search}" IN LISTS` : `EXPLORING LISTS`}
							</Container>
						),
					},
					{
						label: (
							<>
								<ReviewsRounded />
								Reviews
							</>
						),
						content: (
							<Container maxWidth="md">
								{search ? `SEARCHING FOR "${search}" IN REVIEWS` : `EXPLORING REVIEWS`}
							</Container>
						),
					},
					{
						label: (
							<>
								<PeopleRounded />
								Viewers
							</>
						),
						content: (
							<Container maxWidth="md">
								{search ? `SEARCHING FOR "${search}" IN VIEWERS` : `EXPLORING VIEWERS`}
							</Container>
						),
					},
				]}
			/>
		</Box>
	);
};
