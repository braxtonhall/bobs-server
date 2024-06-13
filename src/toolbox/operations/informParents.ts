import { db, transaction } from "../../db";
import Config from "../../Config";
import { DateTime } from "luxon";
import { getUnsubLink } from "../../auth/operations";
import ejs from "ejs";
import { EmailPersona, enqueue, sendQueuedMessages } from "../../email";
import AsyncPool from "../../util/AsyncPool";

const MAX_CONCURRENT_PROMISES = 10;

const sendNotificationEmail = async (env: {
	address: string;
	boxId: string;
	childId: string;
	parentId: string;
	childContent: string;
	parentContent: string;
}) => {
	const { link: unsubLink } = await getUnsubLink(env.address);
	const html = await ejs.renderFile("views/emails/reply.ejs", {
		manageLink: new URL(`https://${Config.HOST}/toolbox/subscriptions`).toString(),
		replyLink: new URL(`https://${Config.HOST}/boxes/${env.boxId}?cursor=${env.childId}`).toString(),
		replyContent: env.childContent,
		originalLink: new URL(`https://${Config.HOST}/boxes/${env.boxId}?cursor=${env.parentId}`).toString(),
		originalContent: env.parentContent,
		unsubscribeLink: unsubLink.toString(),
	});
	await enqueue({
		persona: EmailPersona.BOBS_MAILER,
		address: env.address,
		subject: "You received a new reply",
		html,
	});
};

export const informParents = () =>
	transaction(async () => {
		const now = DateTime.now();
		const replies = await db.post.findMany({
			where: {
				parentId: { notIn: null },
				notified: false,
				createdAt: {
					// No longer can be deleted
					lte: now.minus({ minute: Config.DELETION_TIME_MIN }).toJSDate(),
					gt: now
						// Add one in case it's configured as zero
						.minus({ hour: (Config.SUBSCRIPTION_DIGEST_DELAY_HOURS + 1) * 2 })
						.minus({ minute: Config.DELETION_TIME_MIN }) // in case this is larger than above
						.toJSDate(),
				},
			},
			select: {
				boxId: true,
				id: true,
				content: true,
				emailId: true,
				parent: {
					select: {
						id: true,
						subscribed: true,
						content: true,
						email: {
							select: {
								id: true,
								confirmed: true,
								subscribed: true,
								address: true,
							},
						},
					},
				},
			},
		});
		await AsyncPool.mapToSettled(
			replies,
			async ({ boxId, id, parent, content, emailId }) => {
				if (
					parent &&
					parent.subscribed &&
					parent.email?.confirmed &&
					parent.email.subscribed &&
					parent.email.id !== emailId
				) {
					await sendNotificationEmail({
						boxId,
						address: parent.email.address,
						childId: id,
						parentId: parent.id,
						parentContent: parent.content,
						childContent: content,
					});
				}
				await db.post.update({
					where: {
						id,
					},
					data: {
						notified: true,
					},
				});
			},
			MAX_CONCURRENT_PROMISES,
		);
	}).finally(sendQueuedMessages);
