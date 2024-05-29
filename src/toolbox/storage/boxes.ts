import { db } from "../../db";
import { match } from "ts-pattern";
import { None, Option, Some } from "../../types/option";
import { Err, Ok, Result } from "../../types/result";
import { Failure } from "../../types/failure";

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
		.otherwise(({ origin }) => (origin ? Some(origin) : None));

const create = async (data: { name: string; origin?: string; ownerId: string; stylesheet?: string }): Promise<string> =>
	db.box
		.create({
			data: data,
			select: {
				id: true,
			},
		})
		.then(({ id }) => id);

const edit = async (
	id: string,
	ownerId: string,
	data: { name?: string; origin?: string; stylesheet?: string },
): Promise<Result<undefined, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> => {
	if (await exists(id)) {
		const result = await db.box.update({
			where: {
				id,
				ownerId,
			},
			data,
			select: { id: true },
		});
		if (result) {
			return Ok();
		} else {
			return Err(Failure.FORBIDDEN);
		}
	} else {
		return Err(Failure.MISSING_DEPENDENCY);
	}
};

const exists = (id: string): Promise<boolean> =>
	db.box.findUnique({ where: { id }, select: { id: true } }).then((result) => !!result);

const getStatus = (id: string) =>
	db.box.findUnique({ where: { id }, select: { name: true, deleted: true, stylesheet: true } }).then((result) => {
		if (result) {
			return Some(result);
		} else {
			return None();
		}
	});

const getDetails = (id: string, ownerId: string, postCount: number, cursor?: string) =>
	db.box
		.findUnique({
			where: { id, ownerId },
			select: {
				id: true,
				name: true,
				origin: true,
				deleted: true,
				posts: {
					cursor: cursor ? { id: cursor } : undefined,
					orderBy: { sort: "desc" },
					take: postCount + 1,
					select: {
						id: true,
						createdAt: true,
						content: true,
						from: true,
						parent: {
							select: {
								id: true,
							},
						},
						dead: true,
					},
				},
			},
		})
		.then((result) => {
			if (result) {
				return Some({
					...result,
					posts: result.posts.slice(0, postCount),
					cursor: result.posts[postCount]?.id,
				});
			} else {
				return None();
			}
		});

const list = async (ownerId: string, deleted: boolean, count: number, cursor?: string) => {
	const boxes = await db.box.findMany({
		where: {
			ownerId,
			deleted,
		},
		cursor: typeof cursor === "string" ? { id: cursor } : undefined,
		orderBy: {
			sort: "desc",
		},
		take: count + 1,
	});
	return { boxes: boxes.slice(0, count), cursor: boxes[count]?.id };
};

const setBoxDeletion = async (id: string, ownerId: string, deleted: boolean) =>
	db.$transaction(async (tx) => {
		const box = await tx.box.findUnique({ where: { id }, select: { deleted: true, ownerId: true } });
		if (box === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		} else if (box.ownerId !== ownerId) {
			return Err(Failure.FORBIDDEN);
		} else {
			return Ok(await tx.box.update({ where: { id, ownerId }, data: { deleted }, select: { deleted: true } }));
		}
	});

export default { getOrigin, create, edit, exists, getStatus, list, getDetails, setBoxDeletion };
