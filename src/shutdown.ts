import { shutdownPrisma } from "./db";
import * as jobs from "./jobs";

export const shutdown = async (code: 0 | 1) => {
	await jobs.stop();
	await shutdownPrisma();
	process.exit(code);
};
