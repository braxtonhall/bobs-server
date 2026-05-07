import { db } from "../../db";

export type DocumentType = "private" | "public" | "shared";

type Environment = {
	ownerId: string;
	type: DocumentType;
};

export const createDocument = async ({ ownerId, type }: Environment): Promise<string> => {
	const doc = await db.crdtDocument.create({
		data: { ownerId, type },
		select: { id: true },
	});
	return doc.id;
};
