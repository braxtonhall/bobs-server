import type { Job } from "../jobs.js";
import Config from "../Config.js";
import { db } from "../db.js";
import { DateTime, Duration } from "luxon";

export const removeTokens = {
	callback: async () =>
		db.token.deleteMany({
			where: {
				expiration: {
					lt: DateTime.now().minus({ hour: Config.EXPIRED_TOKEN_STORAGE_HOURS }).toJSDate(),
				},
			},
		}),
	interval: Duration.fromObject({ hour: Config.TOKEN_CLEANUP_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
