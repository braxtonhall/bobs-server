import { db } from "../../db";

type Environment = {
	documentId: string;
	ownerId: string;
	emailAddress: string;
};

export const removeCollaborator = async ({ documentId, ownerId, emailAddress }: Environment): Promise<void> => {
	const doc = await db.crdtDocument.findUnique({ where: { id: documentId, ownerId }, select: { id: true } });
	if (!doc) throw new Error(`Document ${documentId} not found for owner ${ownerId}`);

	const result = await db.crdtCollaborator.deleteMany({
		where: { documentId, email: { address: emailAddress } },
	});
	if (result.count === 0) throw new Error(`${emailAddress} is not a collaborator on document ${documentId}`);
};
