import { db } from "../../db";

export const enrolInGame = async (seasonId: number, recipientId: number, rules: string[]) =>
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
			throw new Error(`Season ${seasonId} does not exist`);
		} else if (rules.length != gameResult.ruleCount) {
			throw new Error(`Sign up requires rules list to have length ${gameResult.ruleCount}`);
		}

		const existingEntry = await tx.entry.findFirst({
			where: {
				seasonId,
				recipientId,
			},
		});
		if (existingEntry) {
			throw new Error("Entry already exists for this user and season");
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
				select: {},
			}),
		);

		await Promise.all(rulePromises);
	});
