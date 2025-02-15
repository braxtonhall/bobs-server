import { api } from "../util/api";
import { ActivityList } from "./ActivityList";
import { SwiperTabs } from "./misc/SwiperTabs";
import { SpaceFillingBoxContainer } from "./misc/SpaceFillingBox";
import { PublicRounded, PeopleRounded } from "@mui/icons-material";
import { useRouteLoaderData } from "react-router-dom";
import { Box, Container } from "@mui/material";

const Activity = () => {
	const { viewer } = useRouteLoaderData("root") as { viewer: unknown };

	return viewer ? (
		<SpaceFillingBoxContainer>
			<SwiperTabs
				tabs={[
					{
						label: "Everyone",
						icon: <PublicRounded />,
						content: (
							<ActivityList getActivity={(cursor) => api.getAllEvents.query(cursor)} queryKey={["ALL"]} />
						),
					},
					{
						label: "Friends",
						icon: <PeopleRounded />,
						content: (
							<ActivityList
								getActivity={(cursor) => api.getFollowingEvents.query(cursor)}
								queryKey={["FOLLOWING"]}
							/>
						),
					},
				]}
			/>
		</SpaceFillingBoxContainer>
	) : (
		<Box marginTop="1em" marginBottom="1em">
			<Container maxWidth="md">
				<ActivityList getActivity={(cursor) => api.getAllEvents.query(cursor)} queryKey={["ALL"]} />
			</Container>
		</Box>
	);
};

export default Activity;
