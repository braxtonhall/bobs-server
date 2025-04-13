import { HashedString } from "../../types/hashed.js";
import posts, { InternalPost } from "../storage/posts.js";
import Config from "../../Config.js";
import { Post } from "../schema/post.js";
import { Ok, Result } from "../../types/result.js";
import { Failure } from "../../types/failure.js";
import { match, P } from "ts-pattern";
import { DateTime } from "luxon";

const getEarliestDeletableTime = (): Date => DateTime.now().minus({ minute: Config.DELETION_TIME_MIN }).toJSDate();

export const toPostMember =
	(requestor: HashedString, earliestDeletableTime: Date) =>
	(post: InternalPost): Post => ({
		id: post.id,
		createdAt: post.createdAt,
		content: post.content,
		from: post.from,
		parent: post.parent
			? {
					id: post.parent.id,
					content: post.parent.content,
				}
			: undefined,
		deletable:
			post.box.deleted === false &&
			post.poster.ip === requestor &&
			post.createdAt > earliestDeletableTime &&
			post._count.children === 0,
	});

export const getPosts = async (
	boxId: string,
	requestor: HashedString,
	query: { cursor?: string; dead?: string; take?: string },
): Promise<Result<{ posts: Post[]; cursor?: string }, Failure.MISSING_DEPENDENCY>> => {
	const userPageSize = Number(query.take) || Config.DEFAULT_PAGE_SIZE;
	const pageSize = Math.max(Config.MINIMUM_PAGE_SIZE, Math.min(userPageSize, Config.MAXIMUM_PAGE_SIZE));
	const result = await posts.list({
		boxId,
		ip: requestor,
		showDead: query.dead === "true",
		cursor: typeof query.cursor === "string" ? query.cursor : undefined,
		count: pageSize + 1,
	});
	return match(result)
		.with(Ok(P.select()), (posts) => {
			const externalPosts = posts.map(toPostMember(requestor, getEarliestDeletableTime()));
			return Ok({
				posts: externalPosts.slice(0, pageSize),
				cursor: externalPosts[pageSize]?.id,
			});
		})
		.otherwise((result) => result);
};
