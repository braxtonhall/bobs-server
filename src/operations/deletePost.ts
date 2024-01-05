import { HashedString } from "../types/hashed";
import posts from "../storage/posts";
import posters from "../storage/posters";

export const deletePost = async (requestor: HashedString, boxId: string, postId: string) =>
	posts.delete({
		boxId,
		userId: postId,
		posterId: await posters.getId(requestor),
	});
