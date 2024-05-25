import { db } from "../../db";
import { HashedString } from "../../types/hashed";
import Config from "../../Config";
import { None, Option, Some } from "../../types/option";
import { Ok, Err, Result } from "../../types/result";
import { match, P } from "ts-pattern";
import { Failure } from "../../types/failure";
import boxes from "./boxes";

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
	db.post.create({
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
				},
			},
		},
	});

const create = async (
	createPost: CreatePost,
): Promise<Result<Awaited<ReturnType<typeof internalCreate>>, Failure.MISSING_DEPENDENCY>> => {
	try {
		return Ok(await internalCreate(createPost));
	} catch (error) {
		return Err(Failure.MISSING_DEPENDENCY);
	}
};

type DeletePostQuery = {
	boxId: string;
	postId: string;
	posterId: number;
};
type DeletePostFailure = Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED | Failure.UNAUTHORIZED;
export const deletePost = async (query: DeletePostQuery): Promise<Result<undefined, DeletePostFailure>> =>
	db
		.$transaction([
			db.post.deleteMany({
				where: {
					boxId: query.boxId,
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
				.with({ count: 0, post: P._ }, () => Err(Failure.UNAUTHORIZED))
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
			poster: {
				select: {
					ip: true,
				},
			},
			parent: {
				select: {
					id: true,
				},
			},
			_count: {
				select: {
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

const exists = async (postId: string, boxId: string): Promise<boolean> =>
	match(
		await db.post.findUnique({
			where: {
				id: postId,
				boxId,
			},
			select: {
				id: true,
			},
		}),
	)
		.with({ id: P.select() }, () => true)
		.otherwise(() => false);

const setDeadAndGetPosterId = async (
	id: string,
	address: string,
	dead: boolean,
): Promise<Result<number, Failure.MISSING_DEPENDENCY | Failure.UNAUTHORIZED>> =>
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
						owner: {
							email: {
								address,
							},
						},
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
				return Err(Failure.UNAUTHORIZED);
			} else {
				return Ok(post.posterId);
			}
		});

export default {
	create,
	exists,
	list,
	delete: deletePost,
	setDeadAndGetPosterId,
};
