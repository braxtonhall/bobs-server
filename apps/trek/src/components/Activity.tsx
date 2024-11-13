import { api } from "../util/api";

import { Container } from "@mui/material";
import { ActivityList } from "./ActivityList";

const Activity = () => (
	<Container maxWidth="md">
		<ActivityList getActivity={(cursor) => api.getAllEvents.query(cursor)} queryKey={["ALL"]} />
	</Container>
);

export default Activity;
