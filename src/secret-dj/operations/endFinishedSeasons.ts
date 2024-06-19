import { db, transaction } from "../../db";
import { SeasonState } from "../SeasonState";
import Config from "../../Config";
import { EmailPersona, enqueue, Message, sendQueuedMessages } from "../../email";
import { getUnsubLink } from "../../auth/operations";
import ejs from "ejs";

type RecipientEntry = { recipient: { email: { address: string; subscribed: boolean }; name: string } };

const toMessages = (seasonId: string, entries: RecipientEntry[]): Promise<Message[]> => {
	const link = `https://${Config.HOST}/login?next=${encodeURIComponent(`/secret-dj/games/${seasonId}`)}`;
	const futureMessages = entries
		.filter(({ recipient }) => recipient.email.subscribed)
		.map(async ({ recipient }) => {
			const { link: unsub } = await getUnsubLink(recipient.email.address);
			const html = await ejs.renderFile("views/emails/finished.ejs", {
				name: recipient.name,
				gameLink: link,
				unsubLink: unsub.toString(),
			});
			return {
				persona: EmailPersona.SECRET_DJ,
				address: recipient.email.address,
				html,
				subject: "a season of secret dj has ended",
			};
		});
	return Promise.all(futureMessages);
};

export const endFinishedSeasons = async () => {
	const finishedSeasons = await db.season.findMany({
		where: {
			state: SeasonState.IN_PROGRESS,
			OR: [
				{
					entries: {
						every: {
							submissionUrl: {
								notIn: null,
							},
						},
					},
				},
				{
					hardDeadline: {
						lt: new Date(),
					},
				},
			],
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
