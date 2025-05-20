import * as Y from "yjs";
import { LeveldbPersistence } from "y-leveldb";
import Config from "../../Config";
import { db } from "../../db";

const storage = new LeveldbPersistence(Config.DOCUMENT_DIR);

const activeDocuments = new Map<string, Promise<Y.Doc>>();

export enum DocumentVisibility {
	PUBLIC = "public",
	PRIVATE = "private",
}

export const getDocument = async ({ documentId, emailId }: { documentId: string; emailId?: string }) =>
	db.document.findUnique({
		where: {
			id: documentId,
			deleted: false,
			OR: [
				{ visibility: DocumentVisibility.PUBLIC },
				...(emailId ? [{ ownerId: emailId }, { collaborations: { some: { emailId } } }] : []),
			],
		},
	});

export const editDocument = async ({
	documentId,
	emailId,
	name,
	origin,
	visibility,
}: {
	documentId: string;
	emailId: string;
	name: string;
	origin: string;
	visibility: DocumentVisibility;
}) =>
	db.document.update({
		where: {
			id: documentId,
			ownerId: emailId,
		},
		data: { name, origin, visibility },
	});

export const addCollaborator = async ({
	documentId,
	ownerId,
	collaboratorAddress,
}: {
	documentId: string;
	ownerId: string;
	collaboratorAddress: string;
}) => {
	const { id: collaboratorId } = await db.email.upsert({
		where: { address: collaboratorAddress },
		create: { address: collaboratorAddress },
		update: {},
		select: { id: true },
	});
	return db.collaboration.upsert({
		where: {
			id: {
				documentId,
				emailId: collaboratorId,
			},
			document: {
				id: documentId,
				ownerId,
			},
		},
		update: {},
		create: {
			documentId,
			emailId: collaboratorId,
		},
	});
};

export const removeCollaborator = ({
	documentId,
	ownerId,
	collaboratorAddress,
}: {
	documentId: string;
	ownerId: string;
	collaboratorAddress: string;
}) =>
	db.collaboration.deleteMany({
		where: {
			document: {
				id: documentId,
				ownerId,
			},
			email: {
				address: collaboratorAddress,
			},
		},
	});

const openDocument = (id: string): Promise<Y.Doc> => {
	if (!activeDocuments.has(id)) {
		activeDocuments.set(
			id,
			storage.getYDoc(id).then((ydoc) => {
				// TODO https://github.com/yjs/y-websocket-server/blob/main/src/utils.js
				ydoc.gc = true;
				ydoc.on("update", (update) => storage.storeUpdate(id, update));
				return ydoc;
			}),
		);
	}

	return activeDocuments.get(id) as Promise<Y.Doc>;
};

const closeDocument = (id: string): void => {
	const futureDocument = activeDocuments.get(id);
	activeDocuments.delete(id);
	void futureDocument?.then((document) => document.destroy());
};

export const openManagedDocument = async (id: string) => {
	const document = await openDocument(id);
	return { document, [Symbol.dispose]: () => closeDocument(id) };
};
