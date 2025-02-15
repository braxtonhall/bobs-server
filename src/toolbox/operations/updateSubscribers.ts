import { db, transaction } from "../../db.js";
import Config from "../../Config.js";
import { DateTime } from "luxon";
import { EmailPersona, enqueue, sendQueuedMessages } from "../../email.js";
import ejs from "ejs";
import { getUnsubLink } from "../../auth/operations.js";
import AsyncPool from "../../util/AsyncPool.js";

const MAX_CONCURRENT_PROMISES = 10;

export const updateSubscribers = () =>
	transaction(async () => {
		const now = DateTime.now();
		const subscriptions = await db.subscription.findMany({
			where: {
				email: {
					confirmed: true,
				},
				box: {
					posts: {
						some: {
							createdAt: {
								// This is an unsound optimisation (built around prisma restrictions).
								// If the server was off for a long time,
								// we will miss messages.
								// In the future, we should replace this with SQL, so we do not miss messages
								gt: now
									// Add one in case it's configured as zero
									.minus({ hour: (Config.SUBSCRIPTION_DIGEST_DELAY_HOURS + 1) * 2 })
									.minus({ minute: Config.DELETION_TIME_MIN }) // in case this is larger than above
									.toJSDate(),
							},
						},
					},
				},
				updatedAt: {
					lt: now.minus({ hour: Config.SUBSCRIPTION_DIGEST_DELAY_HOURS }).toJSDate(),
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
			async ({ email, updatedAt, box }) => {
				const count = await db.post.count({
					where: {
						AND: [
							{
								// Must come from this box
								boxId: box.id,
							},
							{
								// Don't notify because of MY posts
								OR: [{ emailId: null }, { NOT: { emailId: email.id } }],
							},
							{
								// These get their own special notifications
								OR: [
									{ parent: null },
									{ parent: { emailId: null } },
									{ NOT: { parent: { emailId: email.id, subscribed: true } } },
								],
							},
							{
								createdAt: {
									// No longer can be deleted
									lte: now.minus({ minute: Config.DELETION_TIME_MIN }).toJSDate(),
								},
							},
							{
								createdAt: {
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
			},
			MAX_CONCURRENT_PROMISES,
		);
	}).finally(sendQueuedMessages);
