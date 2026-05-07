import { db } from "../../db";

type Environment = {
	documentId: string;
	ownerId: string;
};

export const deleteDocument = async ({ documentId, ownerId }: Environment): Promise<void> => {
	const result = await db.crdtDocument.deleteMany({
		where: { id: documentId, ownerId },
	});
	if (result.count === 0) {
		throw new Error(`Document ${documentId} not found for owner ${ownerId}`);
	}
};
