import { DateTime, Duration } from "luxon";
import AsyncPool from "../../util/AsyncPool";
import { Job } from "../../jobs";
import Config from "../../Config";
import { db } from "../../db";
import { updateList } from "../letterboxd";

export const updateLists = {
	interval: Duration.fromObject({ hour: Config.LETTERBOXD_LIST_UPDATE_INTERVAL_HOURS }).toMillis(),
	callback: async () => {
		const lists = await db.list.findMany({
			where: {
				updatedAt: {
					lt: DateTime.now().minus({ hour: Config.LETTERBOXD_LIST_UPDATE_DELAY_DAYS }).toJSDate(),
				},
			},
			select: {
				link: true,
			},
		});
		return AsyncPool.map(lists, updateList, 1);
	},
} satisfies Job;
