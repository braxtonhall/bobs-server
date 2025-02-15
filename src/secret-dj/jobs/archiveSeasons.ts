import { endFinishedSeasons } from "../operations/endFinishedSeasons.js";
import type { Job } from "../../jobs.js";
import Config from "../../Config.js";
import { Duration } from "luxon";

export const archiveSeasons = {
	callback: endFinishedSeasons,
	interval: Duration.fromObject({ hour: Config.SEASON_ARCHIVE_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
