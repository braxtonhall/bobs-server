import { db, transaction } from "../../db";
import { match } from "ts-pattern";
import { None, Option, Some } from "../../types/option";
import { Err, Ok, Result } from "../../types/result";
import { Failure } from "../../types/failure";
import { Email, Permission } from "@prisma/client";

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
						email: {
							select: {
								address: true,
							},
						},
					},
				},
			},
		})
		.then((result) => {
			if (result) {
				// if permission array is empty, then user must be the owner
				const permissions =
					result.permissions[0] ||
					({
						canKill: true,
						canSetPermissions: true,
						canDelete: true,
						canSetDetails: true,
					} satisfies Omit<(typeof result.permissions)[number], "email">);
				return Some({
					...result,
					permissions,
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

const ifCanEditBox =
	<Callback extends (box: { ownerId: string }) => Promise<Result<unknown, unknown>>>(
		ids: { userId: string; boxId: string },
		permissionNeeded: PermissionKey,
		callback: Callback,
	) =>
	async (): Promise<
		Result<never, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN> | Awaited<ReturnType<Callback>>
	> => {
		const box = await db.box.findUnique({
			where: { id: ids.boxId },
			select: {
				ownerId: true,
				permissions: {
					where: {
						emailId: ids.userId,
						[permissionNeeded]: true,
					},
				},
			},
		});
		if (box === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		} else if (box.ownerId !== ids.userId && box.permissions.length === 0) {
			return Err(Failure.FORBIDDEN);
		} else {
			return (await callback(box)) as Awaited<ReturnType<Callback>>;
		}
	};

const setBoxDeletion = async (
	id: string,
	userId: string,
	deleted: boolean,
): Promise<Result<undefined, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> =>
	transaction(
		ifCanEditBox({ boxId: id, userId }, "canDelete", async () => {
			await db.box.update({ where: { id }, data: { deleted }, select: { deleted: true } });
			return Ok();
		}),
	);

type PermissionKey = keyof Permission & `can${string}`;

type MaintainerEnv = {
	userId: string;
	boxId: string;
	address: string;
	permissions: Pick<Permission, PermissionKey>;
};

const setMaintainer = async ({
	userId,
	boxId,
	address,
	permissions,
}: MaintainerEnv): Promise<
	Result<undefined, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN | Failure.PRECONDITION_FAILED>
> =>
	transaction(
		ifCanEditBox({ userId, boxId }, "canSetPermissions", async ({ ownerId }) => {
			const { id: emailId } = await db.email.upsert({
				where: { address },
				create: { address },
				update: {},
				select: { id: true },
			});
			if (emailId === ownerId) {
				return Err(Failure.PRECONDITION_FAILED);
			}
			await db.permission.upsert({
				where: {
					id: { emailId, boxId },
				},
				create: {
					...permissions,
					emailId,
					boxId,
				},
				update: permissions,
			});
			return Ok();
		}),
	);

const removeMaintainer = async ({
	userId,
	boxId,
	address,
}: Omit<MaintainerEnv, "permissions">): Promise<Result<undefined, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> =>
	transaction(
		ifCanEditBox({ userId, boxId }, "canSetPermissions", async () => {
			const result = await db.permission.deleteMany({
				where: {
					boxId,
					email: {
						address,
					},
				},
			});
			return result.count ? Ok() : Err(Failure.MISSING_DEPENDENCY);
		}),
	);

const getMaintainers = async ({ userId, boxId }: Omit<MaintainerEnv, "permissions" | "address">) =>
	transaction(
		ifCanEditBox(
			{ userId, boxId },
			"canSetPermissions",
			async (): Promise<Result<(Permission & { email: Email })[], never>> =>
				Ok(
					await db.permission.findMany({
						where: { boxId },
						include: {
							email: true,
						},
					}),
				),
		),
	);

export default {
	getOrigin,
	create,
	edit,
	exists,
	getStatus,
	list,
	getDetails,
	setBoxDeletion,
	setMaintainer,
	removeMaintainer,
	getMaintainers,
};
