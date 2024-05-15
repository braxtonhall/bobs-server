import express from "express";
import { randomUUID } from "crypto";
import Config from "../../Config";
import { encode } from "../token";
import { db } from "../../db";
import { Token } from "@prisma/client";
import { TokenType } from "../TokenType";
import { DateTime } from "luxon";

const isValid = (
	token: (Token & { email: { address: string } }) | null,
	address: string,
): token is NonNullable<typeof token> =>
	token !== null && token.valid && token.expiration >= new Date() && token.email.address === address;

const login = ({ email: address }: { email: string }) =>
	db.$transaction(async (tx) => {
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
	});

const authenticate = ({ email: address, temporaryToken }: { email: string; temporaryToken: string }): Promise<string> =>
	db.$transaction(async (tx) => {
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
			throw new Error("Token is not valid");
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

		return encode(apiToken.id);
	});

const authRouter = express.Router();

authRouter.post("/authenticate", async (req, res) => {
	try {
		// TODO this should only apply to api.bobs-server.net
		//  and instead should use a COOKIE if part of the website view
		const token = await authenticate(req.body as { email: string; temporaryToken: string }); // TODO use a schema/parser
		return res.json({ token });
	} catch {
		return res.sendStatus(401);
	}
});

authRouter.post("/login", async (req, res) =>
	login(req.body as { email: string })
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(400)),
);

export { authRouter };
