import { db } from "../../db";

type Environment = {
	ownerId: string;
};

export const createDocument = async ({ ownerId }: Environment): Promise<string> => {
	const doc = await db.crdtDocument.create({
		data: { ownerId, type: "private" },
		select: { id: true },
	});
	return doc.id;
};
