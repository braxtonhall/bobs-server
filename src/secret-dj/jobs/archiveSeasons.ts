import { endFinishedSeasons } from "../operations/endFinishedSeasons";
import type { Job } from "../../jobs";

const FOUR_HOURS = 4 * 60 * 60 * 1000; // TODO this should be a config value

export const archiveSeasons = {
	callback: endFinishedSeasons,
	interval: FOUR_HOURS,
} satisfies Job;
