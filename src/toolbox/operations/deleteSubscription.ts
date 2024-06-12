import { db } from "../../db";

export const deleteSubscription = async ({ boxId, emailId }: { boxId: string; emailId: string }) =>
	db.subscription.delete({
		where: { id: { boxId, emailId } },
	});
