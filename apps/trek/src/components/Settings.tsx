import { Fragment } from "react";
import { UserSettings } from "../types";

const Settings = (props: { settings: UserSettings | null; setSettings: (settings: UserSettings) => void }) => {
	return (
		<Fragment>
			<p>This is where the Settings go</p>
		</Fragment>
	);
};

export default Settings;
