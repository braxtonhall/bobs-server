import { db } from "../../db";

export const getSeason = async (seasonId: string) => {
	const season = await db.season.findUnique({
		where: {
			id: seasonId,
		},
		include: {
			owner: true,
			entries: {
				select: {
					id: true,
					recipientId: true,
					djId: true,
					submissionUrl: true,
				},
			},
		},
	});

	if (!season) {
		throw new Error("Could not find season");
	}

	return season;
};
