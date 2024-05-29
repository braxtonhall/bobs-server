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
				owner: {
					select: {
						email: {
							select: {
								id: true,
							},
						},
					},
				},
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
			// https://github.com/prisma/prisma/issues/7093 this is *really* annoying
			const box = await tx.box.create({
				data: {
					name: "comments",
					origin: "*",
					ownerId: result.owner.email.id,
				},
				select: {
					id: true,
				},
			});
			await tx.entry.create({
				data: {
					seasonId,
					recipientId,
					rules: {
						createMany: {
							data: rules.map((text) => ({ text })),
						},
					},
					boxId: box.id,
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
