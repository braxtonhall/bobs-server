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
import { startVerificationForReplies } from "../../auth/operations";
import { sendQueuedMessages } from "../../email";
import { transaction } from "../../db";

export const createPost = async (
	boxId: string,
	{ parent: parentId, email: address, content, from }: CreatePost,
	ip: HashedString,
): Promise<Result<Post, Failure.MISSING_DEPENDENCY | Failure.PRECONDITION_FAILED>> =>
	transaction(async () => {
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

				if (email?.confirmed === false) {
					await startVerificationForReplies(email.address);
				}

				if (creationResult.type === "err") {
					return creationResult;
				}

				const post = creationResult.value;
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
	}).finally(() => void sendQueuedMessages());
