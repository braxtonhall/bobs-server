import { archiveSeasons } from "./secret-dj/jobs/archiveSeasons";
import { removeTokens } from "./auth/jobs";
import { sendBoxUpdates } from "./toolbox/jobs/sendBoxUpdates";
import { sendReplyUpdates } from "./toolbox/jobs/sendReplyUpdates";
import AsyncPool from "./util/AsyncPool";

// https://github.com/prisma/prisma/issues/22947
// https://github.com/prisma/prisma-engines/pull/4907
const MAX_CONCURRENT_JOBS = 1;

export type Job = { callback: () => unknown; interval: number };

const jobs: Job[] = [archiveSeasons, removeTokens, sendBoxUpdates, sendReplyUpdates];
const scheduledJobs = new Set<NodeJS.Timeout>();
const pool = new AsyncPool(MAX_CONCURRENT_JOBS);

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
