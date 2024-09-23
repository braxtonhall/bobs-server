import { Fragment } from "react";
import { UserSettings } from "../types";

const Activity = (props: { settings: UserSettings | null }) => {
	return (
		<Fragment>
			<p>This is where the activity goes</p>
		</Fragment>
	);
};

export default Activity;
