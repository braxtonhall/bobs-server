import type { Job } from "../../jobs.js";
import { updateSubscribers } from "../operations/updateSubscribers.js";
import Config from "../../Config.js";
import { Duration } from "luxon";

export const sendBoxUpdates = {
	callback: updateSubscribers,
	interval: Duration.fromObject({ hours: Config.SUBSCRIPTION_DIGEST_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
