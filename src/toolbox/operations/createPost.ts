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

// TODO this should be done via ejs. The user content could have html in it
const notificationHtml = (env: {
	replyContent: string;
	originalContent: string;
	replyLink: string;
	originalLink: string;
	unsubscribeLink: string;
	manageLink: string;
}) => `You are receiving this email because <a href="${env.originalLink}">one of your messages</a> received a new <a href="${env.replyLink}">reply</a>.
<div style="border: dashed 1px; width: 400px%; padding: 0.5em">
<blockquote style="border: dotted 1px; color: gray; padding: 0.5em; margin: 0.5em; font-style: italic;">
<a href="${env.originalLink}">
${env.originalContent.length > 90 ? env.originalContent.slice(0, 90) + "..." : env.originalContent}
</a>
</blockquote>
<span>
<a href="${env.replyLink}">
${env.replyContent}
</a>
</span>
</div>
To manage your email preferences, sign in to bob's server <a href="${env.manageLink}">here</a>.
To unsubscribe from all emails from bob's server, <a href="${env.unsubscribeLink}">click here</a>.
`;

const sendNotificationEmail = async (env: {
	address: string;
	boxId: string;
	childId: string;
	parentId: string;
	childContent: string;
	parentContent: string;
}) => {
	const { link: unsubLink } = await getUnsubLink(db, env.address);
	await enqueue(db, {
		address: env.address,
		subject: "You received a new reply",
		html: notificationHtml({
			manageLink: new URL(`https://${Config.HOST}/toolbox/posts`).toString(),
			replyLink: new URL(`https://${Config.HOST}/boxes/${env.boxId}?cursor=${env.childId}`).toString(),
			replyContent: env.childContent,
			originalLink: new URL(`https://${Config.HOST}/boxes/${env.boxId}?cursor=${env.parentId}`).toString(),
			originalContent: env.parentContent,
			unsubscribeLink: unsubLink.toString(),
		}),
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
				children: 0,
				content,
				from,
			});
		})
		.otherwise(() => Err(Failure.MISSING_DEPENDENCY));
};
