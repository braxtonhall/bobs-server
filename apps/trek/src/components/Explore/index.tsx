import { Box, Container } from "@mui/material";
import { useState } from "react";
import { DebouncedTextField } from "../misc/DebouncedTextField";
import { ListRounded, PeopleRounded, ReviewsRounded, VideoLibraryRounded } from "@mui/icons-material";
import { SwiperTabs } from "../misc/SwiperTabs";
import { SpaceFillingBoxContainer } from "../misc/SpaceFillingBox";

export const Explore = () => {
	const [search, setSearch] = useState("");

	return (
		<SpaceFillingBoxContainer flexDirection="column">
			<Box marginTop="1em">
				<Container maxWidth="md">
					<DebouncedTextField
						placeholder="Search…"
						autoComplete="off"
						variant="standard"
						fullWidth
						onChange={(search) => setSearch(search.target.value)}
					/>
				</Container>
			</Box>
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
		</SpaceFillingBoxContainer>
	);
};
