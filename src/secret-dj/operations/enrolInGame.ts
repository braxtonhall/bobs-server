import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	seasonId: number;
	recipientId: number;
	rules: string[];
};

export const enrolInGame = async ({ seasonId, recipientId, rules }: Environment): Promise<void> =>
	db.$transaction(async (tx) => {
		const gameResult = await tx.season.findUnique({
			where: {
				id: seasonId,
				state: SeasonState.SIGN_UP,
			},
			select: {
				ruleCount: true,
			},
		});

		if (!gameResult) {
			throw new Error(`Season ${seasonId} does not exist`);
		} else if (rules.length !== gameResult.ruleCount) {
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
			throw new Error(`Error creating entry for participant ${recipientId} and season ${seasonId}`);
		}

		const entryId = entryResult.id;

		const rulePromises = rules.map((rule) =>
			tx.rule.create({
				data: {
					text: rule,
					playlistEntryId: entryId,
				},
				select: { id: true },
			}),
		);

		await Promise.all(rulePromises);
	});
