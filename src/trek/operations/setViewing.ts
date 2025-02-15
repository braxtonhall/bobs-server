import { db, transaction } from "../../db.js";

type Environment = {
	emailId: string;
	name: string;
};

export const setViewing = async ({ emailId, name }: Environment) => {
	const viewer = await db.viewer.upsert({
		where: { emailId },
		create: {
			email: {
				connect: {
					id: emailId,
				},
			},
			name,
			createdAt: { create: {} },
		},
		update: { name },
	});
	return viewer.id;
};
