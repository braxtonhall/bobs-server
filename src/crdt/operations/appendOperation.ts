import { db } from "../../db";

const TRIM_THRESHOLD = 50;

export const appendOperation = async (documentId: string, update: Uint8Array): Promise<boolean> => {
	await db.crdtOperation.create({
		data: { documentId, update: Buffer.from(update) },
	});
	const count = await db.crdtOperation.count({ where: { documentId } });
	return count >= TRIM_THRESHOLD;
};
