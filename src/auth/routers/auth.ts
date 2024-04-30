import express from "express";
import { randomUUID } from "crypto";
import Config from "../../Config";
import { encode } from "../token";
import { db } from "../../db";
import { Token } from "@prisma/client";
import { TokenType } from "../TokenType";
import { DateTime } from "luxon";

const authRouter = express.Router();

authRouter.post("/login", async (req, res) =>
	db
		.$transaction(async (tx) => {
			const { email: address } = req.body as { email: string }; // TODO use a schema/parser
			const temporaryToken = randomUUID();
			await tx.token.create({
				data: {
					type: TokenType.TEMP,
					temporaryToken,
					expiration: DateTime.now().plus({ minute: Config.TEMP_TOKEN_EXPIRATION_MIN }).toJSDate(),
					email: {
						connectOrCreate: {
							where: { address },
							create: { address },
						},
					},
				},
			});
			// TODO send temporaryToken to user's email address
		})
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(400)),
);

const isValid = (
	token: (Token & { email: { address: string } }) | null,
	address: string,
): token is NonNullable<typeof token> =>
	token !== null && token.valid && token.expiration >= new Date() && token.email.address === address;

authRouter.post("/authenticate", async (req, res) =>
	db.$transaction(async (tx) => {
		const { email: address, temporaryToken } = req.body as { email: string; temporaryToken: string }; // TODO use a schema/parser

		const token = await tx.token.findUnique({
			where: {
				type: TokenType.TEMP,
				temporaryToken,
			},
			include: {
				email: {
					select: {
						address: true,
						confirmed: true,
					},
				},
			},
		});

		if (!isValid(token, address)) {
			// TODO if invalid (and exists), just delete the token
			return res.sendStatus(401);
		}

		const apiToken = await tx.token.create({
			data: {
				type: TokenType.JWT,
				expiration: DateTime.now().plus({ hour: Config.API_TOKEN_EXPIRATION_HOURS }).toJSDate(),
				email: {
					connect: {
						address,
					},
				},
			},
		});

		token.email.confirmed ||
			(await tx.email.update({
				where: {
					address,
				},
				data: {
					confirmed: true,
				},
			}));

		// TODO... should we just delete this?
		//  It might be nice to keep it around a while so we
		//  can have a nicer error message
		await tx.token.update({
			where: { id: token.id },
			data: { valid: false },
		});

		return res.json({ token: encode(apiToken.id) });
	}),
);

export { authRouter };
