import { db, transaction } from "../../db";
import { SeasonState } from "../SeasonState";
import Config from "../../Config";
import { EmailPersona, enqueue, Message, sendQueuedMessages } from "../../email";
import { getUnsubLink } from "../../auth/operations";

type RecipientEntry = { recipient: { email: { address: string; subscribed: boolean }; name: string } };

const toMessages = (seasonId: string, entries: RecipientEntry[]): Promise<Message[]> => {
	const link = `https://${Config.HOST}/login?redirect=${encodeURIComponent(`/secret-dj/games/${seasonId}`)}`;
	const futureMessages = entries
		.filter(({ recipient }) => recipient.email.subscribed)
		.map(async ({ recipient }) => {
			const { link: unsub } = await getUnsubLink(recipient.email.address);
			return {
				persona: EmailPersona.SECRET_DJ,
				address: recipient.email.address,
				html: `${recipient.name}, your playlist is ready. <a href="${link}">click here to see your playlist</a>.
<br/>
to unsubscribe from all emails from bob's server, <a href="${unsub.toString()}">click here</a>`,
				subject: "a season of secret dj has ended",
			};
		});
	return Promise.all(futureMessages);
};

export const endFinishedSeasons = async () => {
	const finishedSeasons = await db.season.findMany({
		where: {
			state: SeasonState.IN_PROGRESS,
			entries: {
				every: {
					submissionUrl: {
						notIn: null,
					},
				},
			},
		},
		select: {
			entries: {
				select: {
					recipient: {
						select: {
							name: true,
							email: {
								select: {
									address: true,
									subscribed: true,
								},
							},
						},
					},
				},
			},
			id: true,
		},
	});
	const futureUpdates = finishedSeasons.map(async ({ id, entries }) => {
		await transaction(async (): Promise<void> => {
			await db.season.update({
				where: { id },
				data: {
					state: SeasonState.ENDED,
					unlisted: false,
				},
			});
			await enqueue(...(await toMessages(id, entries)));
		});
		void sendQueuedMessages();
	});
	const updates = await Promise.all(futureUpdates);
	return updates.length;
};
