import { db } from "../../db";

export const getSubscriptions = async (emailId: string) =>
	db.subscription
		.findMany({
			where: { emailId },
			select: { box: { select: { id: true, name: true } } },
		})
		.then((subs) => subs.map(({ box }) => box));
