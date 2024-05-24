import { db } from "../../db";
import { SeasonState } from "../SeasonState";

export const endFinishedSeasons = async () => {
	const { count } = await db.season.updateMany({
		where: {
			state: SeasonState.IN_PROGRESS,
			entries: {
				every: {
					submissionUrl: {
						notIn: null,
					},
				},
			},
		},
		data: {
			state: SeasonState.ENDED,
		},
	});
	return count;
};
