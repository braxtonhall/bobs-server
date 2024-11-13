import { db } from "../../db";
import { getUserRatings as getUserRatingsQuery } from "@prisma/client/sql";

export const getViewerRatings = async (viewerId: string) => {
	const results = await db.$queryRawTyped(getUserRatingsQuery(viewerId));
	if (results[0]) {
		const ratings = results[0];
		return {
			oneCount: Number(ratings.oneCount),
			twoCount: Number(ratings.twoCount),
			threeCount: Number(ratings.threeCount),
			fourCount: Number(ratings.fourCount),
			fiveCount: Number(ratings.fiveCount),
			sixCount: Number(ratings.sixCount),
			sevenCount: Number(ratings.sevenCount),
			eightCount: Number(ratings.eightCount),
			nineCount: Number(ratings.nineCount),
			tenCount: Number(ratings.tenCount),
		};
	} else {
		return null;
	}
};
