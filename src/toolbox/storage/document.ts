import Config from "../../Config.js";
import { db } from "../../db.js";
import { Repo } from "@automerge/automerge-repo";
import { WebSocketServerAdapter } from "@automerge/automerge-repo-network-websocket";
import fs from "fs/promises";
import path from "node:path";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import ws from "ws";

export enum DocumentVisibility {
	PUBLIC = "public",
	PRIVATE = "private",
}

export const getRepo = async ({ documentId, emailId }: { documentId: string; emailId?: string }) =>
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

const repos = new Map<string, { repo: Repo; wss: any }>();

export const openDocument = async (id: string) => {
	if (!repos.has(id)) {
		const persistence = path.join(Config.DOCUMENT_DIR, id);
		await fs.mkdir(persistence).catch(() => void "do nothing");
		const wss = new (ws as any).Server({ noServer: true });
		const repo = new Repo({
			network: [new WebSocketServerAdapter(wss as any)],
			storage: new NodeFSStorageAdapter(persistence),
		});
		repos.set(id, { repo, wss });
	}
	return repos.get(id)!;
};
