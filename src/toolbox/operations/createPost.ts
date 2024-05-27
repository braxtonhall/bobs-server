import { CreatePost } from "../schema/createPost";
import { Err, map, Result } from "../../types/result";
import posts from "../storage/posts";
import posters from "../storage/posters";
import emails from "../storage/emails";
import { Failure } from "../../types/failure";
import { HashedString } from "../../types/hashed";
import { None, Some } from "../../types/option";
import { match, P } from "ts-pattern";
import { Post } from "../schema/post";

const sendConfirmationEmail = (_address: string) => {
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
): Promise<Result<Post, Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED>> => {
	if (parent !== undefined && !(await posts.exists(parent, boxId))) {
		return Err(Failure.MISSING_DEPENDENCY as const);
	} else {
		const emailId = match(await emails.get(address))
			.with(Some(P.select()), (email) => {
				// TODO if parent and parent has an email, email that there has been a response
				if (email?.confirmed === false) {
					sendConfirmationEmail(email.address);
				}
				return email.id;
			})
			.otherwise(() => undefined);
		return map(
			await posts.create({
				boxId,
				content,
				from,
				parentId: parent,
				emailId,
				posterId: await posters.getId(ip),
			}),
			(internalPost) =>
				({
					id: internalPost.id,
					createdAt: internalPost.createdAt,
					parent: internalPost.parent?.id,
					deletable: true,
					content,
					from,
				}) satisfies Post,
		);
	}
};
