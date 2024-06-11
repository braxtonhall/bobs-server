import { db, transaction } from "../../db";
import Config from "../../Config";
import { DateTime } from "luxon";
import { EmailPersona, enqueue, sendQueuedMessages } from "../../email";
import ejs from "ejs";
import { getUnsubLink } from "../../auth/operations";
import AsyncPool from "../../util/AsyncPool";

const MAX_CONCURRENT_PROMISES = 10;

const updateSubscribers = async () => {
	const now = DateTime.now();
	const subscriptions = await db.subscription.findMany({
		where: {
			email: {
				confirmed: true,
			},
			updatedAt: {
				lt: now.minus({ hour: Config.SUBSCRIPTION_DIGEST_INTERVAL_HOURS }).toJSDate(),
			},
		},
		select: {
			updatedAt: true,
			box: {
				select: {
					id: true,
					name: true,
				},
			},
			email: {
				select: {
					id: true,
					address: true,
				},
			},
		},
	});
	await AsyncPool.mapToSettled(
		subscriptions,
		({ email, updatedAt, box }) =>
			transaction(async () => {
				const count = await db.post.count({
					where: {
						AND: [
							{
								// Must come from this box
								boxId: box.id,
							},
							{
								NOT: {
									OR: [
										// Don't notify because of MY posts
										{ emailId: email.id },
										// These get their own special notifications
										{ parent: { emailId: email.id, subscribed: true } },
									],
								},
							},
							{
								createdAt: {
									// No longer can be deleted
									lte: now.minus({ minute: Config.DELETION_TIME_MIN }).toJSDate(),
									// Outside the range of the last scan
									gt: DateTime.fromJSDate(updatedAt)
										.minus({ minute: Config.DELETION_TIME_MIN })
										.toJSDate(),
								},
							},
						],
					},
				});
				if (count) {
					const { link: unsub } = await getUnsubLink(email.address);
					const html = await ejs.renderFile("views/emails/updates.ejs", {
						boxLink: new URL(`https://${Config.HOST}/boxes/${box.id}`).toString(),
						boxName: box.name,
						manageLink: new URL(`https://${Config.HOST}/toolbox/subscriptions`).toString(),
						unsubscribeLink: unsub.toString(),
					});
					await enqueue({
						persona: EmailPersona.BOBS_MAILER,
						address: email.address,
						subject: `New posts in ${box.name}`,
						html,
					});
				}
				await db.subscription.update({
					where: { id: { boxId: box.id, emailId: email.id } },
					data: { updatedAt: now.toJSDate() },
				});
			}),
		MAX_CONCURRENT_PROMISES,
	);
	void sendQueuedMessages();
};
