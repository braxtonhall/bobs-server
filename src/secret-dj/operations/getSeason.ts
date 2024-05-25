import { db } from "../../db";

export const getSeason = async (seasonId: string) => {
	const season = await db.season.findUnique({
		where: {
			userId: seasonId,
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
