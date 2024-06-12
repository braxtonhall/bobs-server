import { db, transaction } from "../../db";
import { SeasonState } from "../SeasonState";
import Config from "../../Config";

type Environment = {
	seasonId: string;
	recipientId: string;
	rules: string[];
};

export const setRules = ({ seasonId, recipientId, rules }: Environment) =>
	transaction(async () => {
		const season = await db.season.findUnique({
			where: {
				id: seasonId,
				state: SeasonState.SIGN_UP,
			},
			select: {
				ruleCount: true,
				name: true,
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
		if (season === null) {
			throw new Error("Game does not exist in sign-up");
		} else if (season.ruleCount !== rules.length) {
			throw new Error(`Should have provided ${season.ruleCount} rules`);
		}

		const maybeEntry = await db.entry.findFirst({
			where: {
				seasonId,
				recipientId,
			},
		});
		if (maybeEntry === null) {
			const recipient = await db.participant.findUniqueOrThrow({
				where: {
					id: recipientId,
				},
				select: {
					name: true,
					email: {
						select: {
							id: true,
						},
					},
				},
			});
			// https://github.com/prisma/prisma/issues/7093 this is *really* annoying
			const box = await db.box.create({
				data: {
					name: `secret dj/${season.name}/${recipient.name}`,
					stylesheet: `https://${Config.HOST}/public/secret-dj/styles.css`,
				},
				select: {
					id: true,
				},
			});
			await Promise.all([
				db.permission
					.create({
						data: { boxId: box.id, emailId: season.owner.email.id, canDelete: true, canKill: true },
					})
					.then(() =>
						db.permission.upsert({
							where: { id: { boxId: box.id, emailId: recipient.email.id } },
							create: { boxId: box.id, emailId: recipient.email.id, canKill: true },
							update: {},
						}),
					),
				db.subscription.create({
					data: {
						boxId: box.id,
						emailId: recipient.email.id,
					},
				}),
				db.entry.create({
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
				}),
			]);
		} else {
			await db.entry.update({
				where: {
					id: maybeEntry.id,
				},
				data: {
					rules: {
						// Order matters in prisma (TERRIBLE!!!)
						deleteMany: {},
						createMany: {
							data: rules.map((text) => ({ text })),
						},
					},
				},
			});
		}
	});
