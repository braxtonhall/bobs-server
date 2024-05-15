import { Email, Token } from "@prisma/client";
import { decode, encode } from "./token";
import { db } from "../db";
import { TokenType } from "./TokenType";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import Config from "../Config";

const isValid = (
	token: (Token & { email: { address: string } }) | null,
	address: string,
): token is NonNullable<typeof token> =>
	token !== null && token.valid && token.expiration >= new Date() && token.email.address === address;

export const login = ({ email: address }: { email: string }) =>
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

export const authorize = ({
	email: address,
	temporaryToken,
}: {
	email: string;
	temporaryToken: string;
}): Promise<string> =>
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

export const authenticate = async (token: string): Promise<Email> => {
	const tokenId = decode(token);
	const dbToken = await db.token.findUnique({
		where: { id: tokenId, type: TokenType.JWT },
		include: { email: true },
	});

	if (dbToken === null || !dbToken.valid || dbToken.expiration < new Date()) {
		// TODO if invalid, just delete the token
		throw new Error("Token is not valid");
	} else {
		return dbToken.email;
	}
};
