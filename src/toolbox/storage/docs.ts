import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";

import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

import { LeveldbPersistence } from "y-leveldb";

import { WebSocket } from "ws";
import Config from "../../Config";

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

const persistence = new LeveldbPersistence(Config.DOCUMENT_DIR);

const bindState = async (id: string, ydoc: Y.Doc) => {
	const persistedYdoc = await persistence.getYDoc(id);
	const newUpdates = Y.encodeStateAsUpdate(ydoc);
	void persistence.storeUpdate(id, newUpdates);
	Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
	ydoc.on("update", async (update) => persistence.storeUpdate(id, update));
};

const docs = new Map<string, WSSharedDoc>();

const messageSync = 0;
const messageAwareness = 1;

const updateHandler = (update: Uint8Array, _origin: unknown, doc: WSSharedDoc, _tr: unknown) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, messageSync);
	syncProtocol.writeUpdate(encoder, update);
	const message = encoding.toUint8Array(encoder);
	console.log("telling", doc.conns);
	doc.conns.forEach((_: Set<number>, conn: WebSocket) => send(doc, conn, message));
};

class WSSharedDoc extends Y.Doc {
	conns: Map<WebSocket, Set<number>> = new Map();
	awareness: awarenessProtocol.Awareness;

	constructor(public readonly id: string) {
		super({ gc: true });
		this.awareness = new awarenessProtocol.Awareness(this);
		this.awareness.setLocalState(null);
		this.awareness.on(
			"update",
			(
				{ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
				conn: WebSocket,
			) => {
				const changedClients = added.concat(updated, removed);
				const connControlledIDs = this.conns.get(conn) ?? new Set();
				added.forEach((clientID) => connControlledIDs.add(clientID));
				removed.forEach((clientID) => connControlledIDs.delete(clientID));

				// broadcast awareness update
				const encoder = encoding.createEncoder();
				encoding.writeVarUint(encoder, messageAwareness);
				encoding.writeVarUint8Array(
					encoder,
					awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients),
				);
				const buff = encoding.toUint8Array(encoder);
				this.conns.forEach((_, c) => send(this, c, buff));
			},
		);
		this.on("update", updateHandler as any);
	}
}

export const getYDoc = (id: string) => {
	if (!docs.has(id)) {
		const doc = new WSSharedDoc(id);
		void bindState(id, doc);
		docs.set(id, doc);
	}
	return docs.get(id)!;
};

const messageListener = (conn: WebSocket, doc: WSSharedDoc, message: Uint8Array) => {
	try {
		const encoder = encoding.createEncoder();
		const decoder = decoding.createDecoder(message);
		const messageType = decoding.readVarUint(decoder);
		switch (messageType) {
			case messageSync:
				encoding.writeVarUint(encoder, messageSync);
				syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

				// If the `encoder` only contains the type of reply message and no
				// message, there is no need to send the message. When `encoder` only
				// contains the type of reply, its length is 1.
				if (encoding.length(encoder) > 1) {
					send(doc, conn, encoding.toUint8Array(encoder));
				}
				break;
			case messageAwareness: {
				awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn);
				break;
			}
		}
	} catch (err) {
		console.error(err);
	}
};

const closeConn = (doc: WSSharedDoc, conn: WebSocket) => {
	if (doc.conns.has(conn)) {
		const controlledIds = doc.conns.get(conn) ?? new Set();
		doc.conns.delete(conn);
		awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
		if (doc.conns.size === 0) {
			docs.delete(doc.id);
			doc.destroy();
		}
	}
	conn.close();
};

const send = (doc: WSSharedDoc, conn: WebSocket, m: Uint8Array) => {
	if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
		closeConn(doc, conn);
	}
	try {
		conn.send(m, {}, (err) => {
			err != null && closeConn(doc, conn);
		});
	} catch (e) {
		closeConn(doc, conn);
	}
};

export const setupWSConnection = (conn: WebSocket, id: string) => {
	conn.binaryType = "arraybuffer";
	// get doc, initialize if it does not exist yet
	const doc = getYDoc(id);
	doc.conns.set(conn, new Set());
	// listen and reply to events
	conn.on("message", (message: ArrayBuffer) => messageListener(conn, doc, new Uint8Array(message)));

	// Check if connection is still alive
	let pongReceived = true;
	const pingInterval = setInterval(() => {
		if (!pongReceived) {
			if (doc.conns.has(conn)) {
				closeConn(doc, conn);
			}
			clearInterval(pingInterval);
		} else if (doc.conns.has(conn)) {
			pongReceived = false;
			try {
				conn.ping();
			} catch (e) {
				closeConn(doc, conn);
				clearInterval(pingInterval);
			}
		}
	}, Config.WS_PING_PONG_TIMEOUT_MS);
	conn.on("close", () => {
		closeConn(doc, conn);
		clearInterval(pingInterval);
	});
	conn.on("pong", () => {
		pongReceived = true;
	});
	// put the following in a variables in a block so the interval handlers don't keep in in
	// scope
	{
		// send sync step 1
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, messageSync);
		syncProtocol.writeSyncStep1(encoder, doc);
		send(doc, conn, encoding.toUint8Array(encoder));
		const awarenessStates = doc.awareness.getStates();
		if (awarenessStates.size > 0) {
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, messageAwareness);
			encoding.writeVarUint8Array(
				encoder,
				awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())),
			);
			send(doc, conn, encoding.toUint8Array(encoder));
		}
	}
};
