import * as Y from "yjs";
import { db, transaction } from "../../db";

export const compactDocument = async (documentId: string): Promise<void> => {
	await transaction(async () => {
		const record = await db.crdtDocument.findUnique({
			where: { id: documentId },
			select: {
				snapshot: true,
				operations: { select: { update: true }, orderBy: { id: "asc" } },
			},
		});

		if (!record) return;

		const doc = new Y.Doc();
		if (record.snapshot && record.snapshot.length > 0) {
			Y.applyUpdate(doc, record.snapshot);
		}
		for (const op of record.operations) {
			Y.applyUpdate(doc, op.update);
		}

		const snapshot = Buffer.from(Y.encodeStateAsUpdate(doc));

		await db.crdtOperation.deleteMany({ where: { documentId } });
		await db.crdtDocument.update({
			where: { id: documentId },
			data: { snapshot },
		});
	});
};
