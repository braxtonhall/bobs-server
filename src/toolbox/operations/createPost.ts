import { CreatePost } from "../schema/createPost";
import { Err, Ok, Result } from "../../types/result";
import posts from "../storage/posts";
import posters from "../storage/posters";
import emails from "../storage/emails";
import { Failure } from "../../types/failure";
import { HashedString } from "../../types/hashed";
import { Some, unwrapOr } from "../../types/option";
import { match, P } from "ts-pattern";
import { Post } from "../schema/post";
import { getUnsubLink, startVerification } from "../../auth/operations";
import { enqueue } from "../../email";
import { db } from "../../db";
import Config from "../../Config";

// TODO you NEED to be able to unsubscribe/manage prefs
//  and you should also be able to unsub per-comment
// TODO to unsub ALL is /emails/ID/unsubscribe
// TODO to unsub ONE is /emails/ID/posts/ID/unsubscribe

const sendNotificationEmail = async (env: { address: string; boxId: string; childId: string }) => {
	const url = new URL(`https://${Config.HOST}/boxes/${env.boxId}/posts/${env.childId}`);
	const { link: unsub } = await getUnsubLink(db, env.address);
	await enqueue(db, {
		address: env.address,
		subject: "You received a new reply",
		html: `<a href="${url.toString()}">Click here to see your reply</a>. <a href="${unsub.toString()}">unsubscribe</a>`,
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

			// TODO these messages should really be in a transaction with posts.create(..)
			if (email?.confirmed === false) {
				await startVerification(db, email.address);
			}

			if (creationResult.type == "err") {
				return creationResult;
			}

			const post = creationResult.value;
			// TODO these messages should really be in a transaction with posts.create(..)
			if (parent && parent.subscribed && parent.email?.confirmed && parent.email.subscribed) {
				await sendNotificationEmail({ address: parent.email.address, boxId, childId: post.id });
			}
			return Ok({
				id: post.id,
				createdAt: post.createdAt,
				parent: post.parent?.id,
				deletable: true,
				dead: false,
				content,
				from,
			});
		})
		.otherwise(() => Err(Failure.MISSING_DEPENDENCY));
};
