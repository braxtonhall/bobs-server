import { db } from "../../db";

type Environment = { address: string; cursor?: string; take: number };

export const getEmailPosts = async ({ address, cursor, take }: Environment) => {
	const posts = await db.post.findMany({
		where: {
			email: {
				address,
			},
		},
		orderBy: { sort: "desc" },
		take: take + 1,
		cursor: cursor ? { id: cursor } : undefined,
		select: {
			subscribed: true,
			boxId: true,
			id: true,
			createdAt: true,
			content: true,
			from: true,
		},
	});
	return { posts: posts.slice(0, take), cursor: posts[take]?.id };
};
