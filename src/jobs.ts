import { archiveSeasons } from "./secret-dj/jobs/archiveSeasons";

export type Job = { callback: () => unknown; interval: number };

const jobs: Job[] = [archiveSeasons];
const runningJobs = new Set<NodeJS.Timeout>();

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
