import { CreatePost } from "../schema/createPost";
import { Err, Ok, Result } from "../types/result";
import posts from "../storage/posts";
import posters from "../storage/posters";
import emails from "../storage/emails";
import { Failure } from "../types/failure";
import { HashedString } from "../types/hashed";
import { Some } from "../types/option";
import { match, P } from "ts-pattern";
import { Post } from "../schema/post";

const sendConfirmationEmail = (address: string) => {
	// TODO!!!
	// https://www.prisma.io/blog/backend-prisma-typescript-orm-with-postgresql-auth-mngp1ps7kip4
	// https://sendgrid.com/en-us
	// TODO you NEED to be able to unsubscribe/manage prefs
	//  and you should also be able to unsub per-comment
	// TODO to unsub ALL is /emails/ID/unsubscribe
	// TODO to ubsub ONE is /emails/ID/posts/ID/unsubscribe
};

export const createPost = async (
	boxId: string,
	{ parent, email: address, content, from }: CreatePost,
	ip: HashedString,
): Promise<Result<Post, Failure.MISSING_DEPENDENCY>> => {
	const maybeParentId = parent ? await posts.getId(parent, boxId) : Some(undefined);
	return match(maybeParentId)
		.with(Some(P.select()), async (parentId) => {
			const email = await emails.get(address ?? "");
			// TODO if parent and parent has an email, email that there has been a response
			if (email?.confirmed === false) {
				sendConfirmationEmail(email.address);
			}
			const internalPost = await posts.create({
				boxId,
				content,
				from,
				parentId,
				emailId: email?.id,
				posterId: await posters.getId(ip),
			});
			return Ok({
				id: internalPost.userId,
				createdAt: internalPost.createdAt,
				parent: internalPost.parent?.userId,
				deletable: true,
				content,
				from,
			} satisfies Post);
		})
		.otherwise(() => Err(Failure.MISSING_DEPENDENCY as const));
};
