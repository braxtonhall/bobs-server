import { archiveSeasons } from "./secret-dj/jobs/archiveSeasons.js";
import { removeTokens } from "./auth/jobs.js";
import { sendBoxUpdates } from "./toolbox/jobs/sendBoxUpdates.js";
import { sendReplyUpdates } from "./toolbox/jobs/sendReplyUpdates.js";
import AsyncPool from "./util/AsyncPool.js";
import { sendReminders } from "./secret-dj/jobs/sendReminders.js";
import { loadContent } from "./trek/jobs/loadContent.js";
import { deleteBadEvents } from "./trek/jobs/deleteBadEvents.js";
import { ensureHashes } from "./trek/jobs/ensureHashes.js";
import { loadFonts } from "./toolbox/canvas/fonts.js";

export type Job = { callback: () => unknown; interval: number };

const jobs: Job[] = [
	loadFonts,
	archiveSeasons,
	removeTokens,
	sendBoxUpdates,
	sendReplyUpdates,
	sendReminders,
	loadContent,
	deleteBadEvents,
	ensureHashes,
];

const scheduledJobs = new Set<NodeJS.Timeout>();
const pool = new AsyncPool(jobs.length);

const stop = async () => {
	scheduledJobs.forEach((interval) => clearInterval(interval));
	await pool.drain();
};

const start = () => {
	now();
	jobs.forEach((job) => {
		if (job.interval < Infinity) {
			scheduledJobs.add(setInterval(() => pool.run(job.callback), job.interval));
		}
	});
};

const now = () => {
	const invocations = jobs.map((job) => pool.run(job.callback));
	void Promise.allSettled(invocations);
};

export { stop, start, now };
