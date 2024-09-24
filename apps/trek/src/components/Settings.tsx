import { UserSettings } from "../types";

const Settings = (props: { settings: UserSettings | null; setSettings: (settings: UserSettings) => void }) => {
	return (
		<>
			<p>This is where the Settings go</p>
		</>
	);
};

export default Settings;
