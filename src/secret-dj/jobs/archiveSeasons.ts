import { checkFinishedSeasons } from "../operations/checkFinishedSeasons";
import type { Job } from "../../jobs";

const FOUR_HOURS = 4 * 60 * 60 * 1000;

export const archiveSeasons = {
	callback: checkFinishedSeasons,
	interval: FOUR_HOURS,
} satisfies Job;
