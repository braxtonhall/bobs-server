import { db, transaction } from "../../db";
import { DateTime } from "luxon";
import { SeasonState } from "../SeasonState";
import Config from "../../Config";
import { EmailPersona, enqueue, Message, sendQueuedMessages } from "../../email";
import { getUnsubLink } from "../../auth/operations";
import ejs from "ejs";

type ReminderEntry = { season: { id: string }; dj: { name: string; email: { address: string } } };

const toMessages = async (entries: ReminderEntry[]): Promise<Message[]> => {
	const futureMessages = entries.map(async ({ dj, season }) => {
		const link = `https://${Config.HOST}/login?next=${encodeURIComponent(`/secret-dj/games/${season.id}`)}`;
		const { link: unsub } = await getUnsubLink(dj!.email.address);
		const html = await ejs.renderFile("views/emails/reminder.ejs", {
			name: dj!.name,
			gameLink: link,
			unsubLink: unsub.toString(),
		});
		return {
			persona: EmailPersona.SECRET_DJ,
			address: dj!.email.address,
			html,
			subject: "it's getting late...",
		};
	});
	return Promise.all(futureMessages);
};

export const sendReminders = () =>
	transaction(async () => {
		const now = DateTime.now();
		const seasons = await db.season.findMany({
			where: {
				state: SeasonState.IN_PROGRESS,
				softDeadline: { lt: now.toJSDate() },
				remindedAt: { lt: now.minus({ hour: Config.REMINDER_DELAY_HOURS }).toJSDate() },
				entries: {
					some: {
						submissionUrl: { in: null },
						dj: {
							email: {
								subscribed: true,
							},
						},
					},
				},
			},
			select: {
				id: true,
				softDeadline: true,
				hardDeadline: true,
				entries: {
					where: {
						submissionUrl: { in: null },
						dj: {
							email: {
								subscribed: true,
							},
						},
					},
					select: {
						dj: {
							select: {
								name: true,
								email: {
									select: {
										address: true,
									},
								},
							},
						},
					},
				},
			},
		});
		const entries: ReminderEntry[] = seasons
			.flatMap((season) => season.entries.map(({ dj }) => ({ season, dj })))
			.filter((entry): entry is typeof entry & ReminderEntry => !!entry.dj);
		await enqueue(...(await toMessages(entries)));
	}).finally(sendQueuedMessages);
