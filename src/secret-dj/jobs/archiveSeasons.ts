import { endFinishedSeasons } from "../operations/endFinishedSeasons";
import type { Job } from "../../jobs";
import Config from "../../Config";
import { Duration } from "luxon";

export const archiveSeasons = {
	callback: endFinishedSeasons,
	interval: Duration.fromObject({ hour: Config.SEASON_ARCHIVE_INTERVAL_HOURS }).toMillis(),
} satisfies Job;
