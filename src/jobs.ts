import { archiveSeasons } from "./secret-dj/jobs/archiveSeasons";
import { removeTokens } from "./auth/jobs";
import { sendBoxUpdates } from "./toolbox/jobs/sendBoxUpdates";

export type Job = { callback: () => unknown; interval: number };

const jobs: Job[] = [archiveSeasons, removeTokens, sendBoxUpdates];
const runningJobs = new Set<NodeJS.Timeout>();

// TODO stop should also drain all the currently running jobs...
const stop = () => runningJobs.forEach((interval) => clearInterval(interval));

const start = () => {
	now();
	jobs.forEach((job) => {
		if (job.interval < Infinity) {
			runningJobs.add(setInterval(job.callback, job.interval));
		}
	});
};

const now = () => {
	const invocations = jobs.map((job) => (async () => job.callback())());
	void Promise.allSettled(invocations);
};

export { stop, start, now };
