import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { Repo } from "@automerge/automerge-repo";

const network = new WebSocketClientAdapter("ws://localhost:8080/repos/cmalgp9vx0002pvjh1hxnz24g");
const repo = new Repo({
	network: [network],
});

void (async function () {
	const handle = await repo.find('46HPw3T5hXxPTsgW8eDepwjwtMGG');
	await handle.whenReady();
	// handle.change((doc) => {
	// 	doc.foo = 'now';
	// });
	console.log(handle.doc());
})();
