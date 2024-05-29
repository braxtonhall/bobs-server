import { db } from "../../db";

export const getSeason = async (seasonId: string) => {
	const season = await db.season.findUnique({
		where: {
			id: seasonId,
		},
		include: {
			owner: true,
			box: {
				select: {
					id: true,
				},
			},
			entries: {
				select: {
					id: true,
					recipient: {
						select: {
							id: true,
							name: true,
						},
					},
					dj: {
						select: {
							id: true,
							name: true,
						},
					},
					submissionUrl: true,
					rules: true,
				},
			},
		},
	});

	if (!season) {
		throw new Error("Could not find season");
	}

	return season;
};
