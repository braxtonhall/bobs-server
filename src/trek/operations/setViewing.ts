import { db } from "../../db";

type Environment = {
	emailId: string;
	name: string;
};

export const setViewing = ({ emailId, name }: Environment) =>
	db.viewer.upsert({
		where: {
			emailId,
		},
		create: {
			emailId,
			name,
		},
		update: {
			emailId,
			name,
		},
	});
