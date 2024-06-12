import { PrismaClient } from "@prisma/client";
import { getServers } from "./server";
import Config from "./Config";
import * as jobs from "./jobs";
import { sendQueuedMessages } from "./email";

const prisma = new PrismaClient();

const shutdown = async () => {
	await prisma.$disconnect();
	await jobs.stop();
};

const main = async () => {
	const { http, https } = await getServers();
	http.listen(Config.HTTP_PORT, () => console.log(`http server started on ${Config.HTTP_PORT}`));
	https.listen(Config.HTTPS_PORT, () => console.log(`https server started on ${Config.HTTPS_PORT}`));
	jobs.start();
	void sendQueuedMessages();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main().catch(async (error?) => {
	console.error(error);
	await shutdown();
	process.exit(1);
});
