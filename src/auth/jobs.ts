import type { Job } from "../jobs";
import Config from "../Config";
import { db } from "../db";
import { DateTime } from "luxon";

export const removeTokens = {
	callback: async () =>
		db.token.deleteMany({
			where: {
				expiration: {
					lt: DateTime.now().minus({ hour: Config.EXPIRED_TOKEN_STORAGE_HOURS }).toJSDate(),
				},
			},
		}),
	interval: Config.TOKEN_CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000,
} satisfies Job;
