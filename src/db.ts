import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

type Client = Omit<PrismaClient, ITXClientDenyList>;

const storage = new AsyncLocalStorage<Client>();

export const db = new Proxy(prisma as Client, {
	get(_, key: keyof Client) {
		const client = storage.getStore();
		if (client) {
			return client[key];
		} else {
			return prisma[key];
		}
	},
});

export const transaction = <Args extends any[], R>(
	callback: (...args: Args) => R,
	...args: Args
): Promise<Awaited<R>> =>
	prisma.$transaction(async (tx): Promise<Awaited<R>> => await storage.run(tx, callback, ...args));
