import { api } from "../util/api";
import { ActivityList } from "./ActivityList";
import { SwiperTabs } from "./misc/SwiperTabs";
import { SpaceFillingBoxContainer } from "./misc/SpaceFillingBox";
import { PublicRounded, PeopleRounded } from "@mui/icons-material";

const Activity = () => (
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
);

export default Activity;
