import { db } from "./db";
import { None, Option, Some } from "../types/option";
import { match, P } from "ts-pattern";

export type Email = Awaited<ReturnType<typeof internalGet>>;

const internalGet = (address: string) =>
	db.email.upsert({
		where: {
			address,
		},
		update: {},
		create: {
			address,
		},
		select: {
			id: true,
			confirmed: true,
			address: true,
		},
	});

const get = async (maybeAddress: Option<string>): Promise<Option<Email>> =>
	match(maybeAddress)
		.with(Some(P.select()), (address) => internalGet(address).then(Some))
		.otherwise(None);

export default { get };
