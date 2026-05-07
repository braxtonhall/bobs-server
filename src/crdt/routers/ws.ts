import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import https from "https";
import { IncomingMessage } from "http";
import { authenticate } from "../../auth/operations";
import { getDocumentState } from "../operations/getDocumentState";
import { appendOperation } from "../operations/appendOperation";
import { compactDocument } from "../operations/compactDocument";
import { db } from "../../db";

type Room = {
	doc: Y.Doc;
	clients: Set<WebSocket>;
};

const rooms = new Map<string, Room>();

const parseCookies = (cookieHeader: string = ""): Record<string, string> =>
	Object.fromEntries(
		cookieHeader.split(";").flatMap((pair) => {
			const [key, ...rest] = pair.trim().split("=");
			return key ? [[decodeURIComponent(key), decodeURIComponent(rest.join("="))]] : [];
		}),
	);

const getRoom = async (documentId: string): Promise<Room | null> => {
	const existing = rooms.get(documentId);
	if (existing) return existing;

	const doc = await getDocumentState(documentId);
	if (!doc) return null;

	const room: Room = { doc, clients: new Set() };
	rooms.set(documentId, room);
	return room;
};

const handleConnection = async (ws: WebSocket, req: IncomingMessage): Promise<void> => {
	const url = new URL(req.url!, "https://localhost");
	const documentId = url.pathname.split("/").pop() ?? "";

	const docRecord = await db.crdtDocument.findUnique({
		where: { id: documentId },
		select: { type: true, ownerId: true, collaborators: { select: { emailId: true } } },
	});

	if (!docRecord) {
		ws.close(4004, "Not found");
		return;
	}

	if (docRecord.type !== "public") {
		const cookies = parseCookies(req.headers.cookie);
		let email;
		try {
			email = await authenticate(cookies.token);
		} catch {
			ws.close(4001, "Unauthorized");
			return;
		}

		const isOwner = docRecord.ownerId === email.id;
		const isCollaborator = docRecord.collaborators.some((c) => c.emailId === email.id);

		if (docRecord.type === "private" && !isOwner) {
			ws.close(4003, "Forbidden");
			return;
		}
		if (docRecord.type === "shared" && !isOwner && !isCollaborator) {
			ws.close(4003, "Forbidden");
			return;
		}
	}

	const room = await getRoom(documentId);
	if (!room) {
		ws.close(4004, "Not found");
		return;
	}

	const svParam = url.searchParams.get("sv");
	if (svParam) {
		const stateVector = Buffer.from(svParam, "base64");
		ws.send(Y.encodeStateAsUpdate(room.doc, stateVector));
	} else {
		ws.send(Y.encodeStateAsUpdate(room.doc));
	}

	room.clients.add(ws);

	ws.on("message", async (data: Buffer) => {
		const update = new Uint8Array(data);
		Y.applyUpdate(room.doc, update);

		const shouldCompact = await appendOperation(documentId, update);
		if (shouldCompact) {
			await compactDocument(documentId);
		}

		for (const client of room.clients) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(update);
			}
		}
	});

	ws.on("close", () => {
		room.clients.delete(ws);
		if (room.clients.size === 0) {
			rooms.delete(documentId);
		}
	});
};

export const setupWebSocket = (server: https.Server): void => {
	const wss = new WebSocketServer({ noServer: true });

	server.on("upgrade", (req, socket, head) => {
		const url = new URL(req.url!, "https://localhost");
		if (!url.pathname.startsWith("/crdt/ws/")) {
			socket.destroy();
			return;
		}
		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit("connection", ws, req);
		});
	});

	wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
		handleConnection(ws, req).catch((err) => {
			console.error("WebSocket connection error:", err);
			ws.close(1011, "Internal error");
		});
	});
};
