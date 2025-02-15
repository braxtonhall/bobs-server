import { db } from "../../db.js";

export const getSubscriptions = async (emailId: string) =>
	db.email.findUniqueOrThrow({
		where: { id: emailId },
		select: {
			subscribed: true,
			subscriptions: {
				select: {
					box: { select: { id: true, name: true } },
				},
			},
		},
	});
