import { db } from "./db";

const get = async (address: string) => {
	if (!address) {
		return null;
	}
	return db.email.upsert({
		where: {
			address,
		},
		update: {},
		create: {
			address,
		},
		select: {
			id: true,
			confirmed: true,
			address: true,
		},
	});
};

export default { get };
