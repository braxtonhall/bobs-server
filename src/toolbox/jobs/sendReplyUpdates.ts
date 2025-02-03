import { informParents } from "../operations/informParents.js";
import { Duration } from "luxon";
import Config from "../../Config.js";
import type { Job } from "../../jobs.js";

export const sendReplyUpdates = {
	callback: informParents,
	interval: Duration.fromObject({ hours: Config.SUBSCRIPTION_DIGEST_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
