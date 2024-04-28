import { db } from "../../db";
import { match } from "ts-pattern";
import { None, Option, Some } from "../../types/option";

const getOrigin = async (id: string): Promise<Option<string>> =>
	match(
		await db.box.findUnique({
			where: {
				id,
			},
			select: {
				origin: true,
			},
		}),
	)
		.with(null, None)
		.otherwise(({ origin }) => Some(origin));

const create = async (data: { name: string; origin: string; ownerId: number }): Promise<string> =>
	db.box
		.create({
			data: data,
			select: {
				id: true,
			},
		})
		.then(({ id }) => id);

const edit = async (id: string, address: string, data: { name?: string; origin?: string }): Promise<void> =>
	// TODO should let the user know if the box did not exist or if they are not authorized
	db.box
		.update({
			where: {
				id,
				owner: {
					email: {
						address,
					},
				},
			},
			data,
		})
		.then();

const exists = (id: string): Promise<boolean> =>
	db.box.findUnique({ where: { id }, select: { id: true } }).then((result) => !!result);

const get = (id: string) =>
	db.box.findUnique({ where: { id }, select: { name: true } }).then((result) => {
		if (result) {
			return Some(result);
		} else {
			return None();
		}
	});

// TODO list boxes

export default { getOrigin, create, edit, exists, get };
