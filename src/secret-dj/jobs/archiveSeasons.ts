import { endFinishedSeasons } from "../operations/endFinishedSeasons";
import type { Job } from "../../jobs";

export const archiveSeasons = {
	callback: endFinishedSeasons,
	interval: Infinity,
} satisfies Job;
