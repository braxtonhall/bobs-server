import { db } from "../../db";
import { SeasonState } from "../SeasonState";
import Config from "../../Config";
import { enqueue } from "../../email";

type RecipientEntry = { recipient: { email: { address: string }; name: string } };

const sendMessages = async (tx: Pick<typeof db, "message">, seasonUserId: string, entries: RecipientEntry[]) => {
	const link = `https://${Config.HOST}/secret-dj/games/${seasonUserId}`;
	const messages = entries.map(({ recipient }) => ({
		address: recipient.email.address,
		html: `${recipient.name}, your playlist is ready`,
		text: `${recipient.name}, your playlist is ready. <a href="${link}">click here to see your playlist</a>`,
		subject: "a season of secret dj has ended",
	}));
	await enqueue(tx, ...messages);
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
								},
							},
						},
					},
				},
			},
			userId: true,
			id: true,
		},
	});
	const futureUpdates = finishedSeasons.map(({ id, userId, entries }) =>
		db.$transaction(async (tx): Promise<void> => {
			await tx.season.update({
				where: { id },
				data: {
					state: SeasonState.ENDED,
				},
			});
			await sendMessages(tx, userId, entries); // TODO
		}),
	);
	const updates = await Promise.all(futureUpdates);
	return updates.length;
};
