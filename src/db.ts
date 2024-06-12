import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

type Client = Omit<PrismaClient, ITXClientDenyList>;

const storage = new AsyncLocalStorage<Client>();

export const db: Client = new Proxy(prisma, {
	get(_, key: keyof Client) {
		// if a store exists in dynamic scope use it, else default to global client
		const client = storage.getStore() ?? prisma;
		return client[key];
	},
});

export const transaction = async <Args extends any[], R>(
	callback: (...args: Args) => R,
	...args: Args
): Promise<Awaited<R>> =>
	storage.getStore()
		? await callback(...args)
		: prisma.$transaction(async (tx): Promise<Awaited<R>> => await storage.run(tx, callback, ...args));
