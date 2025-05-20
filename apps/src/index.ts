import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const doc = new Y.Doc();
const wsProvider = new WebsocketProvider("http://localhost:8080/documents", "cmalgp9vx0002pvjh1hxnz24g", doc);

wsProvider.once("sync", () => {
	doc.transact((tx) => {
		const text = tx.doc.getText("text");

		text.delete(0, text.length);
		text.insert(0, "Hello World");
	});
});

wsProvider.on("sync", () => console.log(doc.getText("text").toJSON()));

wsProvider.on("status", (event) => {
	console.log(event.status); // logs "connected" or "disconnected"
	doc.on("sync", console.log);
});
