import { api } from "../util/api";
import { Container } from "@mui/material";
import { ActivityList } from "./ActivityList";
import { SwiperTabs } from "./misc/SwiperTabs";
import { SpaceFillingBoxContainer } from "./misc/SpaceFillingBox";
import { PublicRounded, PeopleRounded } from "@mui/icons-material";

const Activity = () => (
	<SpaceFillingBoxContainer>
		<SwiperTabs
			tabs={[
				{
					label: (
						<>
							<PublicRounded />
							Everyone
						</>
					),
					content: (
						<Container maxWidth="md">
							<ActivityList getActivity={(cursor) => api.getAllEvents.query(cursor)} queryKey={["ALL"]} />
						</Container>
					),
				},
				{
					label: (
						<>
							<PeopleRounded />
							Friends
						</>
					),
					content: (
						<Container maxWidth="md">
							<ActivityList
								getActivity={(cursor) => api.getFollowingEvents.query(cursor)}
								queryKey={["FOLLOWING"]}
							/>
						</Container>
					),
				},
			]}
		/>
	</SpaceFillingBoxContainer>
);

export default Activity;
