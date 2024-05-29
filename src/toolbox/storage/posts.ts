import { db } from "../../db";
import { HashedString } from "../../types/hashed";
import Config from "../../Config";
import { Err, Ok, Result } from "../../types/result";
import { match, P } from "ts-pattern";
import { Failure } from "../../types/failure";
import boxes from "./boxes";
import { None, Option, Some } from "../../types/option";

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

const internalCreate = ({ emailId, content, posterId, boxId, from, parentId }: CreatePost) =>
	db.$transaction(async (tx) => {
		const result = await tx.box.findUnique({ where: { id: boxId }, select: { deleted: true } });
		if (result === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		} else if (result.deleted === true) {
			return Err(Failure.PRECONDITION_FAILED);
		}
		const post = await tx.post.create({
			data: {
				emailId,
				content,
				posterId,
				boxId,
				from,
				parentId,
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
	});

const create = async (createPost: CreatePost) => {
	try {
		return await internalCreate(createPost);
	} catch (error) {
		return Err(Failure.MISSING_DEPENDENCY);
	}
};

type DeletePostQuery = {
	boxId: string;
	postId: string;
	posterId: number;
};
type DeletePostFailure = Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED | Failure.FORBIDDEN;
export const deletePost = async (query: DeletePostQuery): Promise<Result<undefined, DeletePostFailure>> =>
	db
		.$transaction([
			db.post.deleteMany({
				where: {
					box: {
						id: query.boxId,
						deleted: false,
					},
					id: query.postId,
					posterId: query.posterId,
					createdAt: {
						gt: new Date(Date.now() - Config.DELETION_TIME_MS),
					},
					children: {
						none: {},
					},
				},
			}),
			db.post.findUnique({
				where: { id: query.postId, boxId: query.boxId },
				select: { id: true, posterId: true },
			}),
		])
		.then(([{ count }, post]) =>
			match({ count, post })
				.with({ count: 0, post: null }, () => Err(Failure.MISSING_DEPENDENCY))
				.with({ count: 0, post: { posterId: query.posterId } }, () => Err(Failure.PRECONDITION_FAILED))
				.with({ count: 0, post: P._ }, () => Err(Failure.FORBIDDEN))
				.with({ count: P._, post: P._ }, () => Ok())
				.exhaustive(),
		);

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
					children: {
						where: showDead ? {} : defaultQuery,
					},
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
			},
		}),
	)
		.with(P.not(null), Some)
		.otherwise(None);

const setDeadAndGetPosterId = async (
	id: string,
	ownerId: string,
	dead: boolean,
): Promise<Result<number, Failure.MISSING_DEPENDENCY | Failure.FORBIDDEN>> =>
	db
		.$transaction([
			db.post.findUnique({
				where: { id },
				select: { posterId: true },
			}),
			db.post.updateMany({
				where: {
					id,
					box: {
						ownerId,
					},
				},
				data: {
					dead,
				},
			}),
		])
		.then(([post, { count }]) => {
			if (post === null) {
				return Err(Failure.MISSING_DEPENDENCY);
			} else if (count === 0) {
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
	db.$transaction(async (tx) => {
		try {
			await tx.post.update({ where: { id, emailId }, data: { subscribed }, select: { id: true } });
			return Ok();
		} catch {
			const exists = await tx.post.findUnique({ where: { id } });
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
