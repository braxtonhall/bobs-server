import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { hashAddress } from "./util/hashAddress.js";

const prisma = new PrismaClient().$extends({
	query: {
		email: {
			create: ({ args, query }) => {
				args.data.gravatar = hashAddress(args.data.address);
				return query(args);
			},
		},
	},
});

type Client = Omit<typeof prisma, ITXClientDenyList>;

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
		return await prisma.$transaction(procedure);
	}
};
