import { sendReminders as callback } from "../operations/sendReminders";
import type { Job } from "../../jobs";
import Config from "../../Config";
import { Duration } from "luxon";

export const sendReminders = {
	callback,
	interval: Duration.fromObject({ hours: Config.REMINDER_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
