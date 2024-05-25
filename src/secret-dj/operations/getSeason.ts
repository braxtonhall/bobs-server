import { db } from "../../db";

export const getSeason = async (seasonId: string) => {
	const season = await db.season.findUnique({
		where: {
			id: seasonId,
		},
		include: {
			entries: true,
		},
	});

	if (!season) {
		throw new Error("Could not find season");
	}

	return season;
};
