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
	userId: string,
	data: { name?: string; origin?: string; stylesheet?: string },
): Promise<Result<undefined, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> => {
	if (await exists(id)) {
		const result = await db.box.update({
			where: {
				id,
				OR: [
					{
						ownerId: userId,
					},
					{
						permissions: {
							some: {
								emailId: userId,
								canSetDetails: true,
							},
						},
					},
				],
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

const getDetails = (id: string, userId: string, postCount: number, cursor?: string) =>
	db.box
		.findUnique({
			where: {
				id,
				OR: [
					{ ownerId: userId },
					{
						permissions: {
							some: {
								emailId: userId,
								OR: [
									{ canKill: true },
									{ canSetDetails: true },
									{ canDelete: true },
									{ canSetPermissions: true },
								],
							},
						},
					},
				],
			},
			select: {
				id: true,
				name: true,
				origin: true,
				deleted: true,
				stylesheet: true,
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
				permissions: {
					where: {
						emailId: userId,
					},
					select: {
						canKill: true,
						canSetDetails: true,
						canDelete: true,
						canSetPermissions: true,
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

const list = async (userId: string, deleted: boolean, count: number, cursor?: string) => {
	const boxes = await db.box.findMany({
		where: {
			deleted,
			OR: [
				{ ownerId: userId },
				{
					permissions: {
						some: {
							emailId: userId,
							OR: [
								{ canKill: true },
								{ canSetDetails: true },
								{ canDelete: true },
								{ canSetPermissions: true },
							],
						},
					},
				},
			],
		},
		cursor: typeof cursor === "string" ? { id: cursor } : undefined,
		orderBy: {
			sort: "desc",
		},
		take: count + 1,
	});
	return { boxes: boxes.slice(0, count), cursor: boxes[count]?.id };
};

const setBoxDeletion = async (id: string, userId: string, deleted: boolean) =>
	db.$transaction(async (tx) => {
		const box = await tx.box.findUnique({
			where: { id },
			select: {
				deleted: true,
				ownerId: true,
				permissions: {
					where: {
						emailId: userId,
						canDelete: true,
					},
				},
			},
		});
		if (box === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		} else if (box.ownerId !== userId && box.permissions.length === 0) {
			return Err(Failure.FORBIDDEN);
		} else {
			return Ok(await tx.box.update({ where: { id }, data: { deleted }, select: { deleted: true } }));
		}
	});

export default { getOrigin, create, edit, exists, getStatus, list, getDetails, setBoxDeletion };
