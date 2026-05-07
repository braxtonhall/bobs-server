import { db, transaction } from "../../db";

type Environment = {
	documentId: string;
	ownerId: string;
	emailAddress: string;
};

export const addCollaborator = async ({ documentId, ownerId, emailAddress }: Environment): Promise<void> => {
	await transaction(async () => {
		const doc = await db.crdtDocument.findUnique({ where: { id: documentId, ownerId }, select: { id: true } });
		if (!doc) throw new Error(`Document ${documentId} not found for owner ${ownerId}`);

		const { id: emailId } = await db.email.upsert({
			where: { address: emailAddress },
			create: { address: emailAddress },
			update: {},
			select: { id: true },
		});

		if (emailId === ownerId) throw new Error(`Owner cannot be added as a collaborator`);

		await db.crdtCollaborator.create({ data: { documentId, emailId } });
	});
};
