import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import AsyncPool from "./util/AsyncPool";

// https://github.com/prisma/prisma/issues/22947
// https://github.com/prisma/prisma-engines/pull/4907
// when these get resolved, we should be able to just remove this code
const MAX_CONCURRENT_TRANSACTIONS = 1;
const pool = new AsyncPool(MAX_CONCURRENT_TRANSACTIONS);

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
): Promise<Awaited<R>> => {
	if (storage.getStore()) {
		return await callback(...args);
	} else {
		const procedure = async (tx: Client): Promise<R> => storage.run(tx, callback, ...args);
		return await pool.run(() => prisma.$transaction(procedure));
	}
};
