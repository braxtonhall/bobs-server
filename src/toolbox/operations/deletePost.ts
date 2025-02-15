import { HashedString } from "../../types/hashed.js";
import posts from "../storage/posts.js";
import posters from "../storage/posters.js";

export const deletePost = async (requestor: HashedString, boxId: string, postId: string) =>
	posts.delete({
		boxId,
		postId: postId,
		posterId: await posters.getId(requestor),
	});
