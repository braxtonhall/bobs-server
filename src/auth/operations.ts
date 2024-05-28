import { Email, Token } from "@prisma/client";
import { decode, encode } from "./token";
import { db } from "../db";
import { TokenType } from "./TokenType";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import Config from "../Config";
import { AuthorizePayload } from "./schemas";
import { enqueue } from "../email";

type Confirmation = {
	address: string;
	temporaryToken: string;
	protocol: string;
	expiration: Date;
	redirect?: string;
};

export const sendConfirmationEmail = async (confirmation: Confirmation): Promise<void> => {
	const searchParams = new URLSearchParams({
		email: confirmation.address,
		token: confirmation.temporaryToken,
		...(typeof confirmation.redirect === "string" && { redirect: confirmation.redirect }),
	} satisfies AuthorizePayload);
	const url = new URL(`${confirmation.protocol}://${Config.HOST}/authorize?${searchParams}`);
	await enqueue(db, {
		address: confirmation.address,
		subject: "One Time Password",
		html: `<a href="${url.toString()}">Click this link to log in</a>`,
		expiration: confirmation.expiration,
	});
};

const isValid = (
	token: (Token & { email: { address: string } }) | null,
	address: string,
): token is NonNullable<typeof token> =>
	token !== null && token.valid && token.expiration >= new Date() && token.email.address === address;

export const login = ({ email: address, protocol, redirect }: { email: string; protocol: string; redirect?: string }) =>
	db.$transaction(async (tx) => {
		const temporaryToken = randomUUID();
		const expiration = DateTime.now().plus({ minute: Config.TEMP_TOKEN_EXPIRATION_MIN }).toJSDate();
		await tx.token.create({
			data: {
				type: TokenType.LOGIN,
				temporaryToken,
				expiration,
				email: {
					connectOrCreate: {
						where: { address },
						create: { address },
					},
				},
			},
		});
		void sendConfirmationEmail({ address, temporaryToken, protocol, expiration, redirect }).catch(() => {});
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
				type: TokenType.LOGIN,
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

export const deauthenticate = async (token: string): Promise<void> => {
	const tokenId = decode(token);
	await db.token.update({
		where: { id: tokenId, type: TokenType.JWT },
		include: { email: true },
		data: { valid: false },
	});
};
