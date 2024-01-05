import { db } from "./db";
import { HashedString } from "../types/hashed";
import Config from "../Config";
import { None, Option, Some } from "../types/option";
import { Ok, Err, Result } from "../types/result";
import { match, P } from "ts-pattern";
import { Failure } from "../types/failure";

type CreatePost = {
	emailId?: string;
	content: string;
	posterId: number;
	boxId: string;
	from: string;
	parentId?: number;
};

type Query = {
	boxId: string;
	showDead: boolean;
	cursor?: string;
	count: number;
	ip: HashedString;
};

const create = async ({ emailId, content, posterId, boxId, from, parentId }: CreatePost) =>
	await db.post.create({
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
			userId: true,
			parent: {
				select: {
					userId: true,
				},
			},
		},
	});

type DeletePostQuery = {
	boxId: string;
	userId: string;
	posterId: number;
};
type DeletePostFailure = Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED | Failure.UNAUTHORIZED;
export const deletePost = async (query: DeletePostQuery): Promise<Result<undefined, DeletePostFailure>> =>
	db
		.$transaction([
			db.post.deleteMany({
				where: {
					...query,
					createdAt: {
						gt: new Date(Date.now() - Config.DELETION_TIME_MS),
					},
					children: {
						none: {},
					},
				},
			}),
			db.post.findUnique({
				where: { userId: query.userId, boxId: query.boxId },
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
				userId: cursor,
			}
		: undefined;
};

const list = ({ boxId, showDead, cursor, count, ip }: Query) => {
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
			userId: true,
			poster: {
				select: {
					ip: true,
				},
			},
			parent: {
				select: {
					userId: true,
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
			id: "desc",
		},
		take: count,
	});
};

const getId = async (userId: string, boxId: string): Promise<Option<number>> =>
	match(
		await db.post.findUnique({
			where: {
				userId,
				boxId,
			},
			select: {
				id: true,
			},
		}),
	)
		.with({ id: P.select() }, Some)
		.otherwise(None);

const setDeadAndGetPosterId = async (
	id: string,
	address: string,
	dead: boolean,
): Promise<Result<number, Failure.MISSING_DEPENDENCY | Failure.UNAUTHORIZED>> =>
	db
		.$transaction([
			db.post.findUnique({
				where: { userId: id },
				select: { posterId: true },
			}),
			db.post.updateMany({
				where: {
					userId: id,
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
	getId,
	list,
	delete: deletePost,
	setDeadAndGetPosterId,
};
