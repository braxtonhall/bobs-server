import { HashedString } from "../types/hashed";
import posts from "../storage/posts";
import Config from "../Config";
import { Post } from "../schema/post";

const getEarliestDeletableTime = () => Date.now() - Config.DELETION_TIME_MS;

const toPostMember =
	(requestor: HashedString, earliestDeletableTime: number) =>
	(post: Awaited<ReturnType<typeof posts.list>>[number]): Post => ({
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
): Promise<{ posts: Post[]; cursor?: string }> => {
	const userPageSize = Number(query.take) || Config.DEFAULT_PAGE_SIZE;
	const pageSize = Math.max(0, Math.min(userPageSize, Config.MAXIMUM_PAGE_SIZE));
	return posts
		.list({
			boxId,
			ip: requestor,
			showDead: query.dead === "true",
			cursor: query.cursor,
			count: pageSize + 1,
		})
		.then((posts) => posts.map(toPostMember(requestor, getEarliestDeletableTime())))
		.then((posts) => ({
			posts: posts.slice(0, pageSize),
			cursor: posts[pageSize]?.id,
		}));
};
