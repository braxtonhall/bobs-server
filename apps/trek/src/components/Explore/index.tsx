import { Box, Container } from "@mui/material";
import { useState } from "react";
import { DebouncedTextField } from "../misc/DebouncedTextField";
import { TableRowsRounded, PeopleRounded, ReviewsRounded, RectangleRounded } from "@mui/icons-material";
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
						label: "Episodes",
						icon: <RectangleRounded />,
						content: <>{search ? `SEARCHING FOR "${search}" IN EPISODES` : `EXPLORING EPISODES`}</>,
					},
					{
						label: "Lists",
						icon: <TableRowsRounded />,
						// TODO you should also be able to create a list from here!
						content: <>{search ? `SEARCHING FOR "${search}" IN LISTS` : `EXPLORING LISTS`}</>,
					},
					{
						label: "Reviews",
						icon: <ReviewsRounded />,
						content: <>{search ? `SEARCHING FOR "${search}" IN REVIEWS` : `EXPLORING REVIEWS`}</>,
					},
					{
						label: "Viewers",
						icon: <PeopleRounded />,
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
