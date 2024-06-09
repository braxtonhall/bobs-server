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
import { EmailPersona, enqueue, sendQueuedMessages } from "../../email";
import { db } from "../../db";
import Config from "../../Config";
import ejs from "ejs";

const sendNotificationEmail = async (env: {
	address: string;
	boxId: string;
	childId: string;
	parentId: string;
	childContent: string;
	parentContent: string;
}) => {
	const { link: unsubLink } = await getUnsubLink(db, env.address);
	const html = await ejs.renderFile("views/emails/reply.ejs", {
		manageLink: new URL(`https://${Config.HOST}/toolbox/posts`).toString(),
		replyLink: new URL(`https://${Config.HOST}/boxes/${env.boxId}?cursor=${env.childId}`).toString(),
		replyContent: env.childContent,
		originalLink: new URL(`https://${Config.HOST}/boxes/${env.boxId}?cursor=${env.parentId}`).toString(),
		originalContent: env.parentContent,
		unsubscribeLink: unsubLink.toString(),
	});
	await enqueue(db, {
		persona: EmailPersona.BOBS_MAILER,
		address: env.address,
		subject: "You received a new reply",
		html,
	}).catch(() => {});
	// Note: not part of a transaction
	void sendQueuedMessages();
};

export const createPost = async (
	boxId: string,
	{ parent: parentId, email: address, content, from }: CreatePost,
	ip: HashedString,
): Promise<Result<Post, Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED>> => {
	const optionParent = parentId === undefined ? Some(undefined) : await posts.getNotificationInfo(parentId, boxId);
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
			// if we turn this into a transaction, update sendQueuedMessages call
			if (email?.confirmed === false) {
				await startVerification(db, email.address);
			}

			if (creationResult.type == "err") {
				return creationResult;
			}

			const post = creationResult.value;
			// TODO these messages should really be in a transaction with posts.create(..)
			if (parent && parent.subscribed && parent.email?.confirmed && parent.email.subscribed) {
				await sendNotificationEmail({
					address: parent.email.address,
					boxId,
					childId: post.id,
					parentId: parent.id,
					parentContent: parent.content,
					childContent: content,
				});
			}
			return Ok({
				id: post.id,
				createdAt: post.createdAt,
				parent: post.parent
					? {
							id: post.parent.id,
							content: post.parent.content,
						}
					: undefined,
				deletable: true,
				content,
				from,
			});
		})
		.otherwise(() => Err(Failure.MISSING_DEPENDENCY));
};
