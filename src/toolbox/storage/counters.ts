import { db } from "../../db";
import { match, P } from "ts-pattern";
import { None, Option, Some } from "../../types/option";

const updateAndGet = async (id: string): Promise<Option<number>> =>
	match(
		await db.counter.update({
			where: {
				id,
				deleted: false,
			},
			data: {
				count: {
					increment: 1,
				},
			},
			select: {
				count: true,
			},
		}),
	)
		.with({ count: P.number.select() }, Some)
		.otherwise(None);

const getDetails = async (id: string, ownerId: string) =>
	match(
		await db.counter.findUnique({
			where: {
				id,
				owner: {
					id: ownerId,
				},
			},
			select: {
				id: true,
				count: true,
				name: true,
				origin: true,
				deleted: true,
			},
		}),
	)
		.with(P.not(P.nullish), Some)
		.otherwise(None);

const get = async (id: string) =>
	match(
		await db.counter.findUnique({
			where: { id },
			select: { count: true },
		}),
	)
		.with({ count: P.select() }, Some)
		.otherwise(None);

const getOrigin = async (id: string): Promise<Option<string>> =>
	match(
		await db.counter.findUnique({
			where: {
				id,
			},
			select: {
				origin: true,
			},
		}),
	)
		.with(null, None)
		.otherwise(({ origin }) => (origin ? Some(origin) : None));

const create = async (data: { name: string; origin?: string; ownerId: string }): Promise<string> =>
	db.counter
		.create({
			data: data,
			select: {
				id: true,
			},
		})
		.then(({ id }) => id);

const edit = async (id: string, address: string, data: { name?: string; origin?: string }): Promise<void> =>
	// TODO should let the user know if the counter did not exist or if they are not authorized
	db.counter
		.update({
			where: {
				id,
				owner: {
					address,
				},
			},
			data,
		})
		.then();

const list = async (ownerId: string, deleted: boolean, count: number, cursor?: string) => {
	const counters = await db.counter.findMany({
		where: {
			deleted,
			ownerId,
		},
		select: {
			id: true,
			name: true,
			count: true,
		},
		cursor: typeof cursor === "string" ? { id: cursor } : undefined,
		take: count + 1,
		orderBy: {
			sort: "desc",
		},
	});
	return { counters: counters.slice(0, count), cursor: counters[count]?.id };
};

export default { updateAndGet, getDetails, get, getOrigin, create, edit, list };
