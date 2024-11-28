import { Job } from "../../jobs";
import { db } from "../../db";
import { hashAddress } from "../../util/hashAddress";

export const ensureHashes = {
	callback: async () => {
		const emails = await db.email.findMany({ where: { gravatar: { in: null } } });
		for (const email of emails) {
			await db.email.update({
				where: email,
				data: {
					gravatar: hashAddress(email.address),
				},
			});
		}
	},
	interval: Infinity,
} satisfies Job;
