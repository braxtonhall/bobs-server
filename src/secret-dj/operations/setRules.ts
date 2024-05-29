import { db } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	seasonId: string;
	recipientId: string;
	rules: string[];
};

export const setRules = ({ seasonId, recipientId, rules }: Environment) =>
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

		const maybeEntry = await tx.entry.findFirst({
			where: {
				seasonId,
				recipientId,
			},
		});
		if (maybeEntry === null) {
			await tx.entry.create({
				data: {
					seasonId,
					recipientId,
					rules: {
						createMany: {
							data: rules.map((text) => ({ text })),
						},
					},
				},
				select: {
					id: true,
				},
			});
		} else {
			await tx.entry.update({
				where: {
					id: maybeEntry.id,
				},
				data: {
					rules: {
						deleteMany: {},
					},
				},
			});
			await tx.entry.update({
				where: {
					id: maybeEntry.id,
				},
				data: {
					rules: {
						createMany: {
							data: rules.map((text) => ({ text })),
						},
					},
				},
			});
		}
	});
