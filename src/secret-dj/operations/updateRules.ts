import { db } from "../../db";
import { SeasonState } from "../SeasonState";

export const updateRules = (seasonId: number, recipientId: number, rules: string[]) =>
	db.$transaction(async (tx) => {
		const result = await tx.season.findUnique({
			where: {
				id: seasonId,
				state: SeasonState.SIGN_UP,
			},
			select: {
				ruleCount: true,
			},
		});
		if (result === null) {
			throw new Error("Game does not exist in sign-up");
		} else if (result.ruleCount !== rules.length) {
			throw new Error(`Should have provided ${result.ruleCount} rules`);
		}

		const entry = await tx.entry.findFirst({
			where: {
				seasonId,
				recipientId,
			},
		});
		if (entry === null) {
			throw new Error("You have not signed up for this season of secret dj");
		}

		const futureDelete = tx.rule.deleteMany({ where: { playlistEntryId: entry.id } });
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
