import { db } from "../../db";
import { match, P } from "ts-pattern";
import { None, Option, Some } from "../../types/option";

const updateAndGet = async (id: string): Promise<Option<number>> =>
	match(
		await db.counter.update({
			where: {
				id,
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

const get = async (id: string, address: string) => {
	match(
		await db.counter.findUnique({
			where: {
				id,
				owner: {
					address,
				},
			},
			select: {
				count: true,
			},
		}),
	)
		.with({ count: P.number.select() }, Some)
		.otherwise(None);
};

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

// TODO list counters

export default { updateAndGet, get, getOrigin, create, edit };
