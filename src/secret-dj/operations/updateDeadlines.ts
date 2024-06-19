import { Deadlines } from "../schemas";
import { db, transaction } from "../../db";
import { SeasonState } from "../SeasonState";
import { EmailPersona, enqueue, Message, sendQueuedMessages } from "../../email";
import { assertDeadlinesAreReasonable, assertHardDeadlineIsReasonable } from "../util/assertDeadlinesAreReasonable";
import Config from "../../Config";
import { getUnsubLink } from "../../auth/operations";
import ejs from "ejs";

type Environment = {
	ownerId: string;
	seasonId: string;
	deadlines: Deadlines;
};

type Entry = {
	recipient: {
		name: string;
		email: {
			address: string;
			subscribed: boolean;
		};
	};
};

const toMessages = (seasonId: string, entries: Entry[], softDeadline: Date | null): Promise<Message[]> => {
	const link = `https://${Config.HOST}/login?next=${encodeURIComponent(`/secret-dj/games/${seasonId}`)}`;
	const futureMessages = entries
		.filter(({ recipient }) => recipient.email.subscribed)
		.map(async ({ recipient }) => {
			const { link: unsub } = await getUnsubLink(recipient.email.address);
			const html = await ejs.renderFile("views/emails/deadline.ejs", {
				name: recipient.name,
				gameLink: link,
				unsubLink: unsub.toString(),
				softDeadline,
			});
			return {
				persona: EmailPersona.SECRET_DJ,
				address: recipient.email.address,
				html: html,
				subject: "secret dj deadline updated",
			};
		});
	return Promise.all(futureMessages);
};

const assertDeadlineIsIncreasing = (deadlines: { old: Date | null; new: Date | null }) => {
	if (deadlines.old) {
		if (!deadlines.new) {
			throw new Error("cannot remove a deadline");
		} else if (deadlines.old > deadlines.new) {
			throw new Error("new deadline must be greater than existing deadline");
		}
	}
};

const assertDeadlinesAreIncreasing = ({ season, deadlines }: { season: Deadlines; deadlines: Deadlines }) => {
	assertDeadlineIsIncreasing({ old: season.softDeadline, new: deadlines.softDeadline });
	assertDeadlineIsIncreasing({ old: season.hardDeadline, new: deadlines.hardDeadline });
};

export const updateDeadlines = ({ ownerId, seasonId, deadlines }: Environment) =>
	transaction(async () => {
		const season = await db.season.findUnique({
			where: { id: seasonId, ownerId, state: SeasonState.IN_PROGRESS },
			select: {
				entries: {
					select: {
						recipient: {
							select: {
								name: true,
								email: true,
							},
						},
					},
				},
				id: true,
				softDeadline: true,
				hardDeadline: true,
			},
		});
		if (season) {
			if (season.softDeadline && season.softDeadline < new Date()) {
				throw new Error("Cannot update deadline after it has passed");
			}
			assertDeadlinesAreIncreasing({ season, deadlines });
			if (season.softDeadline) {
				assertHardDeadlineIsReasonable({
					softDeadline: deadlines.softDeadline ?? season.softDeadline,
					hardDeadline: deadlines.hardDeadline,
				});
			} else {
				assertDeadlinesAreReasonable(deadlines);
			}
			await db.season.update({
				where: { id: seasonId },
				data: deadlines,
			});
			if (season.softDeadline?.valueOf() !== deadlines.softDeadline?.valueOf()) {
				await enqueue(...(await toMessages(season.id, season.entries, deadlines.softDeadline)));
			}
		} else {
			throw new Error(`Could not find eligible season ${seasonId}`);
		}
	}).finally(() => void sendQueuedMessages());
