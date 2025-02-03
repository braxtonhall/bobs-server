import { sendReminders as callback } from "../operations/sendReminders.js";
import type { Job } from "../../jobs.js";
import Config from "../../Config.js";
import { Duration } from "luxon";

export const sendReminders = {
	callback,
	interval: Duration.fromObject({ hours: Config.REMINDER_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
