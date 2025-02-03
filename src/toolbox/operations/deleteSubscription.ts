import { db } from "../../db.js";

export const deleteSubscription = async ({ boxId, emailId }: { boxId: string; emailId: string }) =>
	db.subscription.delete({
		where: { id: { boxId, emailId } },
	});
