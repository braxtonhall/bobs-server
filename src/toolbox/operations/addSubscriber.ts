import { db, transaction } from "../../db";
import { Err, Ok } from "../../types/result";
import { Failure } from "../../types/failure";
import { startVerificationForSubscription } from "../../auth/operations";
import { sendQueuedMessages } from "../../email";

export const addSubscriber = ({ boxId, address }: { boxId: string; address: string }) =>
	transaction(async () => {
		const box = await db.box.findUnique({ where: { id: boxId } });
		if (box === null) {
			return Err(Failure.MISSING_DEPENDENCY);
		}
		const {
			id: emailId,
			confirmed,
			address: realAddress,
		} = await db.email.upsert({
			where: { address },
			create: { address },
			update: {},
			select: { id: true, confirmed: true, address: true },
		});
		await db.subscription.upsert({
			where: {
				id: { boxId, emailId },
			},
			create: {
				boxId,
				emailId,
			},
			update: {},
		});
		if (!confirmed) {
			await startVerificationForSubscription(realAddress);
		}
		return Ok();
	}).finally(sendQueuedMessages);
