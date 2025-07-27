const express = require("express");
const WebSocket = require("ws");
const sqlite3 = require("sqlite3").verbose();
const Y = require("yjs");
const http = require("http");
const url = require("url");

// Create an Express application
const app = express();

// Create an HTTP server to combine Express with WebSocket
const server = http.createServer(app);

// Set up WebSocket server on the same HTTP server
const wss = new WebSocket.Server({ server });

// SQLite database setup
const db = new sqlite3.Database("./yjs_documents.db");

// Create a table to store Yjs document updates (if it doesn't exist)
db.run("CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY, data BLOB)", (err) => {
	if (err) {
		console.error("Error creating table:", err);
	}
});

// Define ping interval and timeout
const PING_INTERVAL = 30000; // Ping clients every 30 seconds
const CONNECTION_TIMEOUT = 60000; // Disconnect clients if no message for 60 seconds

// Middleware to serve static files (optional)
app.use(express.static("public")); // Serve static files if needed (e.g., HTML, JS)

app.get("/", (req, res) => {
	res.send("WebSocket server is running. Connect using WebSocket to a specific document ID.");
});

// Helper function to broadcast updates to all connected clients for a specific document
function broadcastUpdate(docId, update) {
	wss.clients.forEach((client) => {
		if (client.docId === docId && client.readyState === WebSocket.OPEN) {
			client.send(update);
		}
	});
}

// Handle new WebSocket connections
wss.on("connection", (ws, req) => {
	const { pathname } = url.parse(req.url);
	const match = pathname.match(/^\/doc\/(\d+)$/); // Matches "/doc/1234"

	if (!match) {
		ws.close();
		console.log("Invalid document ID");
		return;
	}

	const docId = match[1];
	console.log(`New client connected to document ${docId}`);

	// Track when the last message was received from the client
	ws.lastActiveTime = Date.now();

	// Load the initial Yjs document from SQLite based on the document ID
	db.get("SELECT data FROM documents WHERE id = ?", [docId], (err, row) => {
		if (err) {
			console.error("Error fetching document:", err);
			return;
		}

		if (row) {
			const update = row.data;
			const doc = new Y.Doc();
			Y.applyUpdate(doc, update);

			// Send the current state of the document to the new client
			ws.send(update);
		}
	});

	// Track this client and the document ID
	ws.docId = docId;

	// Handle messages from the client (Yjs updates)
	ws.on("message", (message) => {
		console.log(`Received update for document ${docId}:`, message);

		// Update last active time when a message is received
		ws.lastActiveTime = Date.now();

		// Apply the received update to the Yjs document
		const doc = new Y.Doc();
		Y.applyUpdate(doc, message);

		// Serialize the update and save it to SQLite
		const update = Y.encodeStateAsUpdate(doc);
		db.run("INSERT OR REPLACE INTO documents (id, data) VALUES (?, ?)", [docId, update], (err) => {
			if (err) {
				console.error("Error saving document:", err);
			} else {
				console.log(`Document ${docId} state saved to database`);
			}
		});

		// Broadcast the update to all other connected clients for this document
		broadcastUpdate(docId, message);
	});

	// Handle WebSocket close event
	ws.on("close", () => {
		console.log(`Client disconnected from document ${docId}`);
	});

	// Handle WebSocket error event
	ws.on("error", (err) => {
		console.error("WebSocket error:", err);
	});
});

// Periodically ping clients and check if they are still alive
setInterval(() => {
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			const timeSinceLastActive = Date.now() - client.lastActiveTime;

			// If the client has been inactive for too long, close the connection
			if (timeSinceLastActive > CONNECTION_TIMEOUT) {
				console.log(`Client disconnected due to inactivity (docId: ${client.docId})`);
				client.close();
			} else {
				// Send ping message to the client (you can use a different ping/pong mechanism if needed)
				client.ping();
			}
		}
	});
}, PING_INTERVAL);

// Start the Express server on a specific port (e.g., 3000)
server.listen(3000, () => {
	console.log("Server running on http://localhost:3000");
});
