const WebSocket = require("ws");
const Automerge = require("@automerge/automerge");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const url = require("url");

const wss = new WebSocket.Server({ port: 8080 });

// Map of docId -> Automerge doc
const documents = new Map();

// Map of docId -> Set of clients
const clientsByDoc = new Map();

async function loadOrCreateDoc(docId) {
	if (documents.has(docId)) return documents.get(docId);

	const existing = await prisma.document.findUnique({ where: { id: docId } });

	let doc;
	if (existing) {
		doc = Automerge.load(existing.content);
		console.log(`Loaded document ${docId} from DB`);
	} else {
		doc = Automerge.from({ messages: [] });
		await prisma.document.create({
			data: {
				id: docId,
				title: `Doc ${docId}`,
				content: Buffer.from(Automerge.save(doc)),
			},
		});
		console.log(`Created new document ${docId}`);
	}

	documents.set(docId, doc);
	clientsByDoc.set(docId, new Set());

	return doc;
}

async function saveDoc(docId) {
	const doc = documents.get(docId);
	if (!doc) return;
	const binary = Automerge.save(doc);

	await prisma.document.upsert({
		where: { id: docId },
		update: { content: Buffer.from(binary) },
		create: { id: docId, title: `Doc ${docId}`, content: Buffer.from(binary) },
	});

	console.log(`Saved document ${docId}`);
}

// Handle WebSocket connections
wss.on("connection", async (ws, req) => {
	const pathname = url.parse(req.url).pathname;
	const match = pathname.match(/^\/doc\/([a-zA-Z0-9_-]+)$/);
	if (!match) {
		ws.close(1008, "Invalid document path");
		return;
	}

	const docId = match[1];
	const doc = await loadOrCreateDoc(docId);

	// Register client
	const clients = clientsByDoc.get(docId);
	clients.add(ws);

	// Send current doc state
	ws.send(Automerge.save(doc));

	// Handle incoming changes
	ws.on("message", (msg) => {
		try {
			const change = new Uint8Array(msg);
			const [newDoc] = Automerge.applyChanges(doc, [change]);
			documents.set(docId, newDoc);

			// Broadcast change to all other clients
			clients.forEach((client) => {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(msg);
				}
			});
		} catch (err) {
			console.error(`Error applying change to doc ${docId}:`, err);
		}
	});

	ws.on("close", async () => {
		clients.delete(ws);
		if (clients.size === 0) {
			console.log(`All clients disconnected from ${docId}, saving...`);
			await saveDoc(docId);
			clientsByDoc.delete(docId);
		}
	});
});

// Graceful shutdown
async function shutdown() {
	console.log("Shutting down. Saving all documents...");
	for (const docId of documents.keys()) {
		await saveDoc(docId);
	}
	await prisma.$disconnect();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("WebSocket CRDT server running on ws://localhost:8080/doc/{docId}");

// client code

const ws = new WebSocket("ws://localhost:8080");
let doc = Automerge.init();

ws.onmessage = (event) => {
	const binary = new Uint8Array(event.data);
	if (doc) {
		const [newDoc] = Automerge.applyChanges(doc, [binary]);
		doc = newDoc;
	} else {
		doc = Automerge.load(binary);
	}
};

function sendChange(newMessage) {
	const newDoc = Automerge.change(doc, (d) => {
		d.messages.push(newMessage);
	});
	const changes = Automerge.getChanges(doc, newDoc);
	changes.forEach((change) => ws.send(change));
	doc = newDoc;
}

// https://www.npmjs.com/package/websocket-express
