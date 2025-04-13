import { SettingsPayload } from "../schemas.js";
import { db } from "../../db.js";

export const setSettings = ({ viewerId, settings }: { viewerId: string; settings: SettingsPayload }) =>
	db.viewer.update({
		where: { id: viewerId },
		data: settings,
	});
