import { Request } from "express";
import { getRepo, openDocument } from "../storage/document.js";
import { Duplex } from "node:stream";

export const onUpgrade = async (req: Request, socket: Duplex, head: Buffer) => {
	const match = req.url.match(/^\/repos\/([a-zA-Z0-9_-]+)$/);
	if (!match) {
		socket.destroy();
		return;
	}

	const repoName = match[1];
	const repo = await getRepo({ documentId: repoName });
	if (!repo) {
		socket.destroy();
		return;
	}

	const { wss } = await openDocument(repoName);
	wss.handleUpgrade(req, socket, head, (socket) => wss.emit("connection", socket));
};
