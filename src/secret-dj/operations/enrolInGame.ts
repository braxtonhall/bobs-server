import { db } from "../../db";

export const enrolInGame = async (seasonId: number, recipientId: number, rules: string[]) => {
	db.$transaction(async (tx) => {
		const gameResult = await tx.season.findUnique({
			where: {
				id: seasonId,
			},
			select: {
				ruleCount: true,
			},
		});

		if (!gameResult) {
			throw new Error("bad");
		}

		const ruleCount = gameResult.ruleCount;
		if (rules.length != ruleCount) {
			throw new Error("bad");
		}

		const entryResult = await tx.entry.create({
			data: {
				seasonId,
				recipientId,
			},
			select: {
				id: true,
			},
		});

		if (!entryResult) {
			throw new Error("bad");
		}

		const entryId = entryResult.id;

		const rulePromises = rules.map((rule) =>
			tx.rule.create({
				data: {
					text: rule,
					playlistEntryId: entryId,
				},
				select: {
					id: true,
				},
			}),
		);

		await Promise.all(rulePromises);
	});
};
