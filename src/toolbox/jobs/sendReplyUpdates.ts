import { informParents } from "../operations/informParents";
import { Duration } from "luxon";
import Config from "../../Config";
import type { Job } from "../../jobs";

export const sendReplyUpdates = {
	callback: informParents,
	interval: Duration.fromObject({ hours: Config.SUBSCRIPTION_DIGEST_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
