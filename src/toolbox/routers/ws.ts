import { WebSocketExpress } from "websocket-express";
import { getDocument } from "../storage/document";
import { setupWSConnection } from "../storage/docs";

export const ws = new WebSocketExpress();

ws.ws("/documents/:document", async (req, res) => {
	const documentId = req.params.document;

	const document = await getDocument({ documentId });
	if (document) {
		const ws = await res.accept();
		return setupWSConnection(ws, document.id);
	} else {
		return res.sendStatus(404);
	}
});
