import { db } from "../../db";

export const setSelf = ({ viewerId, name }: { viewerId: string; name: string }) =>
	db.viewer.update({
		where: { id: viewerId },
		data: { name },
	});
