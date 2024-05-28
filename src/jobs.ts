export type Job = { callback: () => unknown; interval: number };

const jobs: Job[] = [];
const runningJobs = new Set<NodeJS.Timeout>();

const stop = () => runningJobs.forEach((interval) => clearInterval(interval));

const start = () => jobs.forEach((job) => runningJobs.add(setInterval(job.callback, job.interval)));

const now = async () => {
	const invocations = jobs.map((job) => (async () => job.callback())());
	await Promise.all(invocations);
};

export { stop, start, now };
