import type { Job } from "../../jobs";
import { updateSubscribers } from "../operations/updateSubscribers";
import Config from "../../Config";
import { Duration } from "luxon";

export const sendBoxUpdates = {
	callback: updateSubscribers,
	interval: 1000 || Duration.fromObject({ hours: Config.SUBSCRIPTION_DIGEST_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
