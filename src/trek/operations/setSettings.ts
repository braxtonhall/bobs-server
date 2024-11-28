import { SettingsPayload } from "../schemas";
import { db } from "../../db";

export const setSettings = ({ viewerId, settings }: { viewerId: string; settings: SettingsPayload }) =>
	db.viewer.update({
		where: { id: viewerId },
		data: settings,
	});
