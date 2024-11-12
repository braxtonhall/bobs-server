import { Box, Container } from "@mui/material";
import { useState } from "react";
import { DebouncedTextField } from "../misc/DebouncedTextField";
import { ListRounded, PeopleRounded, ReviewsRounded, VideoLibraryRounded } from "@mui/icons-material";
import { SwiperTabs } from "../misc/SwiperTabs";

export const Explore = () => {
	const [search, setSearch] = useState("");

	return (
		<Container maxWidth="md">
			<Box marginTop="1em" width="100%">
				<DebouncedTextField
					placeholder="Search…"
					autoComplete="off"
					variant="standard"
					fullWidth
					onChange={(search) => setSearch(search.target.value)}
				/>
				<SwiperTabs
					tabs={[
						{
							label: (
								<>
									<VideoLibraryRounded />
									Episodes
								</>
							),
							content: <>{search ? `SEARCHING FOR "${search}" IN EPISODES` : `EXPLORING EPISODES`}</>,
						},
						{
							label: (
								<>
									<ListRounded />
									Lists
								</>
							),
							content: <>{search ? `SEARCHING FOR "${search}" IN LISTS` : `EXPLORING LISTS`}</>,
						},
						{
							label: (
								<>
									<ReviewsRounded />
									Reviews
								</>
							),
							content: <>{search ? `SEARCHING FOR "${search}" IN REVIEWS` : `EXPLORING REVIEWS`}</>,
						},
						{
							label: (
								<>
									<PeopleRounded />
									Viewers
								</>
							),
							content: <>{search ? `SEARCHING FOR "${search}" IN VIEWERS` : `EXPLORING VIEWERS`}</>,
						},
					]}
				/>
			</Box>
		</Container>
	);
};
