import { archiveSeasons } from "./secret-dj/jobs/archiveSeasons";
import { removeTokens } from "./auth/jobs";
import { sendBoxUpdates } from "./toolbox/jobs/sendBoxUpdates";
import { sendReplyUpdates } from "./toolbox/jobs/sendReplyUpdates";

export type Job = { callback: () => unknown; interval: number };

const jobs: Job[] = [archiveSeasons, removeTokens, sendBoxUpdates, sendReplyUpdates];
const scheduledJobs = new Set<NodeJS.Timeout>();
const runningJobs = new Set<Promise<unknown>>();

const decorate = (callback: () => unknown) => (): Promise<unknown> => {
	const promise = (async () => callback())().finally(() => runningJobs.delete(promise));
	runningJobs.add(promise);
	return promise;
};

const stop = async () => {
	scheduledJobs.forEach((interval) => clearInterval(interval));
	await Promise.allSettled(runningJobs);
};

const start = () => {
	now();
	jobs.forEach((job) => {
		if (job.interval < Infinity) {
			scheduledJobs.add(setInterval(decorate(job.callback), job.interval));
		}
	});
};

const now = () => {
	const invocations = jobs.map((job) => decorate(job.callback)());
	void Promise.allSettled(invocations);
};

export { stop, start, now };
