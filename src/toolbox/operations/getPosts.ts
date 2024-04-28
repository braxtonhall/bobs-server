import { HashedString } from "../../types/hashed";
import posts, { InternalPost } from "../storage/posts";
import Config from "../../Config";
import { Post } from "../schema/post";
import { Ok, Result } from "../../types/result";
import { Failure } from "../../types/failure";
import { match, P } from "ts-pattern";

const getEarliestDeletableTime = () => Date.now() - Config.DELETION_TIME_MS;

const toPostMember =
	(requestor: HashedString, earliestDeletableTime: number) =>
	(post: InternalPost): Post => ({
		id: post.userId,
		createdAt: post.createdAt,
		content: post.content,
		from: post.from,
		parent: post.parent?.userId,
		deletable:
			post.poster.ip === requestor &&
			post.createdAt.valueOf() > earliestDeletableTime &&
			post._count.children === 0,
	});

export const getPosts = async (
	boxId: string,
	requestor: HashedString,
	query: { cursor?: string; dead?: string; take?: string },
): Promise<Result<{ posts: Post[]; cursor?: string }, Failure.MISSING_DEPENDENCY>> => {
	const userPageSize = Number(query.take) || Config.DEFAULT_PAGE_SIZE;
	const pageSize = Math.max(0, Math.min(userPageSize, Config.MAXIMUM_PAGE_SIZE));
	const result = await posts.list({
		boxId,
		ip: requestor,
		showDead: query.dead === "true",
		cursor: query.cursor,
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
