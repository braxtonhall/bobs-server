import { PrismaClient } from "@prisma/client";
import { getServers } from "./server";
import Config from "./Config";

const prisma = new PrismaClient();

const main = async () => {
	const { http, https } = await getServers();
	http.listen(Config.HTTP_PORT, () => console.log(`http server started on ${Config.HTTP_PORT}`));
	https.listen(Config.HTTPS_PORT, () => console.log(`https server started on ${Config.HTTPS_PORT}`));
};

main().catch(async (error) => {
	console.error(error);
	await prisma.$disconnect();
	process.exit(1);
});
