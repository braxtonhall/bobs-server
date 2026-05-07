import * as Y from "yjs";
import { Email } from "@prisma/client";
import { db } from "../../src/db";
import { dropTables } from "../util";
import { createDocument } from "../../src/crdt/operations/createDocument";
import { deleteDocument } from "../../src/crdt/operations/deleteDocument";
import { getDocumentState } from "../../src/crdt/operations/getDocumentState";
import { appendOperation } from "../../src/crdt/operations/appendOperation";
import { compactDocument } from "../../src/crdt/operations/compactDocument";
import { addCollaborator } from "../../src/crdt/operations/addCollaborator";
import { removeCollaborator } from "../../src/crdt/operations/removeCollaborator";

const makeUpdate = (content: string): Uint8Array => {
	const doc = new Y.Doc();
	doc.getText("content").insert(0, content);
	return Y.encodeStateAsUpdate(doc);
};

const emptyUpdate = Y.encodeStateAsUpdate(new Y.Doc());

describe("CRDT documents", () => {
	let owner: Email;
	let other: Email;

	beforeAll(async () => {
		await dropTables();
		[owner, other] = await Promise.all([
			db.email.create({ data: { address: "owner@crdt.test" } }),
			db.email.create({ data: { address: "other@crdt.test" } }),
		]);
	});

	describe("createDocument", () => {
		it("creates a private document", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "private" });
			const record = await db.crdtDocument.findUnique({ where: { id }, select: { type: true, ownerId: true } });
			expect(record).toEqual({ type: "private", ownerId: owner.id });
		});

		it("creates a public document", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "public" });
			const record = await db.crdtDocument.findUnique({ where: { id }, select: { type: true } });
			expect(record?.type).toBe("public");
		});

		it("creates a shared document", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "shared" });
			const record = await db.crdtDocument.findUnique({ where: { id }, select: { type: true } });
			expect(record?.type).toBe("shared");
		});
	});

	describe("deleteDocument", () => {
		it("owner can delete their document", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "private" });
			await expect(deleteDocument({ documentId: id, ownerId: owner.id })).resolves.not.toThrow();
			await expect(db.crdtDocument.findUnique({ where: { id } })).resolves.toBeNull();
		});

		it("non-owner cannot delete a document", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "private" });
			await expect(deleteDocument({ documentId: id, ownerId: other.id })).rejects.toThrow();
		});

		it("deleting a non-existent document throws", async () => {
			await expect(deleteDocument({ documentId: "nonexistent", ownerId: owner.id })).rejects.toThrow();
		});
	});

	describe("getDocumentState", () => {
		it("returns null for a non-existent document", async () => {
			await expect(getDocumentState("nonexistent")).resolves.toBeNull();
		});

		it("returns an empty doc for a new document with no operations", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "private" });
			const doc = await getDocumentState(id);
			expect(doc).not.toBeNull();
			expect(doc!.getText("content").toString()).toBe("");
		});

		it("reflects operations appended to the document", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "private" });
			await appendOperation(id, makeUpdate("hello world"));
			const doc = await getDocumentState(id);
			expect(doc!.getText("content").toString()).toBe("hello world");
		});
	});

	describe("appendOperation", () => {
		let docId: string;

		beforeAll(async () => {
			docId = await createDocument({ ownerId: owner.id, type: "private" });
		});

		it("returns false for each operation below the trim threshold", async () => {
			for (let i = 0; i < 49; i++) {
				await expect(appendOperation(docId, emptyUpdate)).resolves.toBe(false);
			}
		});

		it("returns true when the trim threshold is reached", async () => {
			await expect(appendOperation(docId, emptyUpdate)).resolves.toBe(true);
		});
	});

	describe("compactDocument", () => {
		it("merges operations into the snapshot and clears the log", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "private" });
			await appendOperation(id, makeUpdate("compact me"));
			await compactDocument(id);
			const record = await db.crdtDocument.findUnique({
				where: { id },
				select: { snapshot: true, operations: true },
			});
			expect(record!.snapshot).not.toBeNull();
			expect(record!.operations).toHaveLength(0);
		});

		it("state is preserved after compaction", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "private" });
			await appendOperation(id, makeUpdate("preserved"));
			await compactDocument(id);
			const doc = await getDocumentState(id);
			expect(doc!.getText("content").toString()).toBe("preserved");
		});

		it("does nothing for a non-existent document", async () => {
			await expect(compactDocument("nonexistent")).resolves.not.toThrow();
		});
	});

	describe("addCollaborator", () => {
		let docId: string;

		beforeAll(async () => {
			docId = await createDocument({ ownerId: owner.id, type: "shared" });
		});

		it("owner can add a collaborator who has an existing account", async () => {
			await expect(
				addCollaborator({ documentId: docId, ownerId: owner.id, emailAddress: other.address }),
			).resolves.not.toThrow();
			const record = await db.crdtCollaborator.findFirst({ where: { documentId: docId, emailId: other.id } });
			expect(record).not.toBeNull();
		});

		it("owner can add a collaborator who has no account yet", async () => {
			const address = "newcomer@crdt.test";
			await expect(
				addCollaborator({ documentId: docId, ownerId: owner.id, emailAddress: address }),
			).resolves.not.toThrow();
			await expect(db.email.findUnique({ where: { address } })).resolves.not.toBeNull();
		});

		it("owner cannot be added as a collaborator", async () => {
			await expect(
				addCollaborator({ documentId: docId, ownerId: owner.id, emailAddress: owner.address }),
			).rejects.toThrow();
		});

		it("non-owner cannot add a collaborator", async () => {
			await expect(
				addCollaborator({ documentId: docId, ownerId: other.id, emailAddress: owner.address }),
			).rejects.toThrow();
		});

		it("adding a duplicate collaborator throws", async () => {
			await expect(
				addCollaborator({ documentId: docId, ownerId: owner.id, emailAddress: other.address }),
			).rejects.toThrow();
		});
	});

	describe("removeCollaborator", () => {
		let docId: string;

		beforeAll(async () => {
			docId = await createDocument({ ownerId: owner.id, type: "shared" });
			await addCollaborator({ documentId: docId, ownerId: owner.id, emailAddress: other.address });
		});

		it("non-owner cannot remove a collaborator", async () => {
			await expect(
				removeCollaborator({ documentId: docId, ownerId: other.id, emailAddress: other.address }),
			).rejects.toThrow();
		});

		it("owner can remove a collaborator", async () => {
			await expect(
				removeCollaborator({ documentId: docId, ownerId: owner.id, emailAddress: other.address }),
			).resolves.not.toThrow();
			const record = await db.crdtCollaborator.findFirst({ where: { documentId: docId, emailId: other.id } });
			expect(record).toBeNull();
		});

		it("removing a non-existent collaborator throws", async () => {
			await expect(
				removeCollaborator({ documentId: docId, ownerId: owner.id, emailAddress: other.address }),
			).rejects.toThrow();
		});

		it("deleting a document cascades to its collaborators", async () => {
			const id = await createDocument({ ownerId: owner.id, type: "shared" });
			await addCollaborator({ documentId: id, ownerId: owner.id, emailAddress: other.address });
			await deleteDocument({ documentId: id, ownerId: owner.id });
			const collaborators = await db.crdtCollaborator.findMany({ where: { documentId: id } });
			expect(collaborators).toHaveLength(0);
		});
	});
});
