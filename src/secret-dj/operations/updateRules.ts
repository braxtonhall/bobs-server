import { db } from "../../db";

export const updateRules = (seasonId: number, recipientId: number, rules: string[]) =>
	db.$transaction(async (tx) => {
		const result = await tx.season.findUnique({
			where: {
				id: seasonId,
			},
			select: {
				ruleCount: true,
			},
		});
		if (result === null) {
			throw new Error("Game does not exist");
		} else if (result.ruleCount !== rules.length) {
			throw new Error(`Should have provided ${result.ruleCount} rules`);
		}

		const entry = await db.entry.findFirst({
			where: {
				seasonId,
				recipientId,
			},
		});
		if (entry === null) {
			throw new Error("You have not signed up for this season of secret dj");
		}

		const futureDelete = db.rule.deleteMany({ where: { playlistEntryId: entry.id } });
		const futureCreates = rules.map((rule) =>
			tx.rule.create({
				data: {
					text: rule,
					playlistEntryId: entry.id,
				},
				select: {
					id: true,
				},
			}),
		);
		await Promise.all([futureDelete, ...futureCreates]);
	});
