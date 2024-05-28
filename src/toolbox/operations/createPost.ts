import { CreatePost } from "../schema/createPost";
import { Err, map, Result } from "../../types/result";
import posts from "../storage/posts";
import posters from "../storage/posters";
import emails from "../storage/emails";
import { Failure } from "../../types/failure";
import { HashedString } from "../../types/hashed";
import { Some, unwrapOr } from "../../types/option";
import { match, P } from "ts-pattern";
import { Post } from "../schema/post";
import { login } from "../../auth/operations";
import { enqueue } from "../../email";
import { db } from "../../db";
import Config from "../../Config";

// TODO you NEED to be able to unsubscribe/manage prefs
//  and you should also be able to unsub per-comment
// TODO to unsub ALL is /emails/ID/unsubscribe
// TODO to ubsub ONE is /emails/ID/posts/ID/unsubscribe

const sendConfirmationEmail = (env: { address: string; boxId: string; postId: string }) => {
	// TODO we should override what the actual message is here
	// TODO this is also probably the wrong url
	const url = new URL(`https://${Config.HOST}/boxes/${env.boxId}/posts/${env.postId}`).toString();
	// TODO we want add a  /verify/:id and also a /unsubscribe/:id. That way we can JUST confirm emails!
	login({ email: env.address, protocol: "https", redirect: url }).catch(() => {});
};

const sendNotificationEmail = (env: { address: string; boxId: string; childId: string }) => {
	// TODO is this where it's going to live?
	const url = new URL(`https://${Config.HOST}/boxes/${env.boxId}/posts/${env.childId}`);
	enqueue(db, {
		address: env.address,
		subject: "You received a new reply",
		html: `<a href="${url.toString()}">Click here to see your reply</a>`,
	}).catch(() => {});
};

export const createPost = async (
	boxId: string,
	{ parent: parentId, email: address, content, from }: CreatePost,
	ip: HashedString,
): Promise<Result<Post, Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED>> => {
	const optionParent = parentId === undefined ? Some(undefined) : await posts.get(parentId, boxId);
	return match(optionParent)
		.with(Some(P.select()), async (parent) => {
			const email = unwrapOr(await emails.get(address), null);
			const creationResult = await posts.create({
				boxId,
				content,
				from,
				parentId: parent?.id,
				emailId: email?.id,
				posterId: await posters.getId(ip),
			});

			return map(creationResult, (post): Post => {
				// TODO these messages should really be in a transaction with posts.create(..)
				if (email?.confirmed === false) {
					sendConfirmationEmail({ address: email.address, boxId, postId: post.id });
				}
				if (parent && parent.subscribed && parent.email?.confirmed && parent.email.subscribed) {
					sendNotificationEmail({ address: parent.email.address, boxId, childId: post.id });
				}
				return {
					id: post.id,
					createdAt: post.createdAt,
					parent: post.parent?.id,
					deletable: true,
					content,
					from,
				};
			});
		})
		.otherwise(() => Err(Failure.MISSING_DEPENDENCY));
};
