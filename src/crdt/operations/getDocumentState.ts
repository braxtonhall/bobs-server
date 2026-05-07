import * as Y from "yjs";
import { db } from "../../db";

export const getDocumentState = async (documentId: string): Promise<Y.Doc | null> => {
	const record = await db.crdtDocument.findUnique({
		where: { id: documentId },
		select: {
			snapshot: true,
			operations: { select: { update: true }, orderBy: { id: "asc" } },
		},
	});

	if (!record) return null;

	const doc = new Y.Doc();
	if (record.snapshot && record.snapshot.length > 0) {
		Y.applyUpdate(doc, record.snapshot);
	}
	for (const op of record.operations) {
		Y.applyUpdate(doc, op.update);
	}
	return doc;
};
