import { archiveSeasons } from "./secret-dj/jobs/archiveSeasons";
import { removeTokens } from "./auth/jobs";
import { sendBoxUpdates } from "./toolbox/jobs/sendBoxUpdates";
import { sendReplyUpdates } from "./toolbox/jobs/sendReplyUpdates";
import AsyncPool from "./util/AsyncPool";
import { sendReminders } from "./secret-dj/jobs/sendReminders";
import { loadContent } from "./trek/jobs/loadContent";
import { deleteBadEvents } from "./trek/jobs/deleteBadEvents";
import { ensureHashes } from "./trek/jobs/ensureHashes";

export type Job = { callback: () => unknown; interval: number };

const jobs: Job[] = [
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
