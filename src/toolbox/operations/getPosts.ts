import { HashedString } from "../../types/hashed";
import posts, { InternalPost } from "../storage/posts";
import Config from "../../Config";
import { Post } from "../schema/post";
import { Ok } from "../../types/result";
import { match, P } from "ts-pattern";
import { map, None, Option, Some } from "../../types/option";

const getEarliestDeletableTime = () => Date.now() - Config.DELETION_TIME_MS;

export const toPostMember =
	(requestor: HashedString, earliestDeletableTime: number) =>
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
			post.createdAt.valueOf() > earliestDeletableTime &&
			post._count.children === 0,
	});

export const getPosts = async (
	boxId: string,
	requestor: HashedString,
	query: { cursor?: string; dead?: string; take?: string },
): Promise<Option<{ posts: Post[]; cursor?: string }>> => {
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
			return Some({
				posts: externalPosts.slice(0, pageSize),
				cursor: externalPosts[pageSize]?.id,
			});
		})
		.otherwise(None);
};

export const getPost = async (
	boxId: string,
	postId: string,
	requestor: HashedString,
	query: { dead?: string },
): Promise<Option<Post>> => {
	return map(
		await posts.get({
			boxId,
			postId,
			ip: requestor,
			showDead: query.dead === "true",
		}),
		(post) => {
			const result = toPostMember(requestor, getEarliestDeletableTime())(post);
			return {
				...result,
				box: post.box,
			};
		},
	);
};
