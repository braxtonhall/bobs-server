import { db } from "../../db.js";

export const setSelf = ({ viewerId, name, about }: { viewerId: string; name: string; about: string }) =>
	db.viewer.update({
		where: { id: viewerId },
		data: { name, about },
	});
