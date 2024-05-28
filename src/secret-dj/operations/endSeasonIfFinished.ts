import { db } from "../../db";
import { SeasonState } from "../SeasonState";
import Config from "../../Config";
import { enqueue, Message } from "../../email";

type RecipientEntry = { recipient: { email: { address: string }; name: string } };

const toMessages = (seasonId: string, entries: RecipientEntry[]): Message[] => {
	const link = `https://${Config.HOST}/secret-dj/games/${seasonId}`;
	return entries.map(({ recipient }) => ({
		address: recipient.email.address,
		html: `${recipient.name}, your playlist is ready. <a href="${link}">click here to see your playlist</a>`,
		subject: "a season of secret dj has ended",
	}));
};

export const endSeasonIfFinished = (seasonId: string) =>
	db.$transaction(async (tx) => {
		try {
			const finishedSeason = await tx.season.update({
				where: {
					id: seasonId,
					state: SeasonState.IN_PROGRESS,
					entries: {
						every: {
							submissionUrl: {
								notIn: null,
							},
						},
					},
				},
				data: {
					state: SeasonState.ENDED,
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
				},
			});
			await enqueue(tx, ...toMessages(seasonId, finishedSeason.entries));
			return true;
		} catch {
			return false;
		}
	});
