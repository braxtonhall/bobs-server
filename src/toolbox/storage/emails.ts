import { db } from "../../db.js";
import { None, Option, Some } from "../../types/option.js";
import { match, P } from "ts-pattern";
import { Failure } from "../../types/failure.js";
import { Err, Ok, Result } from "../../types/result.js";
import { hashAddress } from "../../util/hashAddress.js";

export type Email = Awaited<ReturnType<typeof internalGet>>;

const internalGet = (address: string) =>
	db.email.upsert({
		where: {
			address,
		},
		update: {},
		create: { address, gravatar: hashAddress(address) },
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

const updateSettings = async (
	id: string,
	subscribed: boolean,
): Promise<Result<undefined, Failure.MISSING_DEPENDENCY>> => {
	try {
		await db.email.update({
			where: {
				id,
			},
			data: {
				subscribed,
			},
			select: {
				id: true,
			},
		});
		return Ok();
	} catch {
		return Err(Failure.MISSING_DEPENDENCY);
	}
};

export default { get, updateSettings };
