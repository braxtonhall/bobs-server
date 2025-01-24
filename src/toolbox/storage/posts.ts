import { db, transaction } from "../../db";
import { HashedString } from "../../types/hashed";
import Config from "../../Config";
import { Err, Ok, Result } from "../../types/result";
import { match, P } from "ts-pattern";
import { Failure } from "../../types/failure";
import boxes from "./boxes";
import { None, Option, Some } from "../../types/option";
import { DateTime } from "luxon";

type CreatePost = {
	emailId?: string;
	content: string;
	posterId: number;
	boxId: string;
	from: string;
	parentId?: string;
};

type Query = {
	boxId: string;
	showDead: boolean;
	cursor?: string;
	count: number;
	ip: HashedString;
};

export type InternalPost = Awaited<ReturnType<typeof listInternal>>[number];

const create = ({ emailId, content, posterId, boxId, from, parentId }: CreatePost) =>
	transaction(async () => {
		const result = await db.box.findUnique({ where: { id: boxId }, select: { deleted: true } });
		if (result === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		} else if (result.deleted === true) {
			return Err(Failure.PRECONDITION_FAILED);
		}
		const post = await db.post.create({
			data: {
				emailId,
				content,
				posterId,
				boxId,
				from,
				parentId,
				notified: parentId === undefined,
			},
			select: {
				id: true,
				createdAt: true,
				parent: {
					select: {
						id: true,
						content: true,
					},
				},
			},
		});
		return Ok(post);
	}).catch(() => Err(Failure.MISSING_DEPENDENCY));

type DeletePostQuery = {
	boxId: string;
	postId: string;
	posterId: number;
};
type DeletePostFailure = Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED | Failure.FORBIDDEN;
export const deletePost = async (query: DeletePostQuery): Promise<Result<undefined, DeletePostFailure>> =>
	transaction(async () => {
		const post = await db.post.findUnique({
			where: { id: query.postId, boxId: query.boxId },
			select: { id: true, posterId: true },
		});
		if (post === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		} else if (post.posterId !== query.posterId) {
			return Err(Failure.FORBIDDEN);
		}
		const result = await db.post.deleteMany({
			where: {
				box: {
					id: query.boxId,
					deleted: false,
				},
				id: query.postId,
				posterId: query.posterId,
				createdAt: {
					gt: DateTime.now().minus({ minute: Config.DELETION_TIME_MIN }).toJSDate(),
				},
				children: {
					none: {},
				},
			},
		});
		if (result.count) {
			return Ok();
		} else {
			return Err(Failure.PRECONDITION_FAILED);
		}
	});

const toCursor = (cursor: unknown) => {
	return cursor && typeof cursor === "string"
		? {
				id: cursor,
			}
		: undefined;
};

const list = async (query: Query): Promise<Result<InternalPost[], Failure.MISSING_DEPENDENCY>> =>
	boxes
		.exists(query.boxId)
		.then(async (exists) => (exists ? Ok(await listInternal(query)) : Err(Failure.MISSING_DEPENDENCY)));

const listInternal = ({ boxId, showDead, cursor, count, ip }: Query) => {
	const defaultQuery = {
		OR: [
			{
				poster: {
					ip,
				},
			},
			{
				AND: [
					{
						dead: false,
					},
					{
						poster: {
							karma: {
								lt: Config.KARMA_KILL_THRESHOLD,
							},
						},
					},
				],
			},
		],
	};
	return db.post.findMany({
		select: {
			id: true,
			createdAt: true,
			content: true,
			from: true,
			box: {
				select: {
					deleted: true,
				},
			},
			poster: {
				select: {
					ip: true,
				},
			},
			parent: {
				where: showDead ? {} : defaultQuery,
				select: {
					id: true,
					content: true,
				},
			},
			_count: {
				select: {
					// We want all children, as this is used for
					// if something is deletable
					// not just undead children
					children: {},
				},
			},
		},
		where: {
			boxId,
			...(showDead ? {} : defaultQuery),
		},
		cursor: toCursor(cursor),
		orderBy: {
			sort: "desc",
		},
		take: count,
	});
};

const get = async (
	postId: string,
	boxId: string,
): Promise<
	Option<{
		id: string;
		subscribed: boolean;
		email: { address: string; subscribed: boolean; confirmed: boolean } | null;
		content: string;
	}>
> =>
	match(
		await db.post.findUnique({
			where: {
				id: postId,
				boxId,
			},
			select: {
				id: true,
				email: {
					select: {
						address: true,
						subscribed: true,
						confirmed: true,
					},
				},
				subscribed: true,
				content: true,
			},
		}),
	)
		.with(P.not(null), Some)
		.otherwise(None);

const setDeadAndGetPosterId = async (
	id: string,
	userId: string,
	dead: boolean,
): Promise<Result<number, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> =>
	transaction(async () => {
		const post = await db.post.findUnique({
			where: { id },
			select: { posterId: true },
		});
		if (post === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		}
		const { count } = await db.post.updateMany({
			where: {
				id,
				box: {
					OR: [
						{
							ownerId: userId,
						},
						{
							permissions: {
								some: {
									emailId: userId,
									canKill: true,
								},
							},
						},
					],
				},
			},
			data: {
				dead,
			},
		});
		if (count === 0) {
			return Err(Failure.FORBIDDEN);
		} else {
			return Ok(post.posterId);
		}
	});

const setSubscription = async (
	id: string,
	emailId: string,
	subscribed: boolean,
): Promise<Result<undefined, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> =>
	transaction(async () => {
		try {
			await db.post.update({ where: { id, emailId }, data: { subscribed }, select: { id: true } });
			return Ok();
		} catch {
			const exists = await db.post.findUnique({ where: { id } });
			return Err(exists ? Failure.FORBIDDEN : Failure.MISSING_DEPENDENCY);
		}
	});

export default {
	create,
	get,
	list,
	delete: deletePost,
	setDeadAndGetPosterId,
	setSubscription,
};
