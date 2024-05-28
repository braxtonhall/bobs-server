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

const sendConfirmationEmail = async (tx: Pick<typeof db, "message">, confirmation: Confirmation): Promise<void> => {
	const searchParams = new URLSearchParams({
		email: confirmation.address,
		token: confirmation.temporaryToken,
		...(typeof confirmation.redirect === "string" && { redirect: confirmation.redirect }),
	} satisfies AuthorizePayload);
	const url = new URL(`${confirmation.protocol}://${Config.HOST}/authorize?${searchParams}`);
	await enqueue(tx, {
		address: confirmation.address,
		subject: "One Time Password",
		html: `<a href="${url.toString()}">Click this link to log in</a>`,
		expiration: confirmation.expiration,
	});
};

const unsubLink = ({ email, token }: { email: string; token: string }) => {
	const searchParams = new URLSearchParams({
		email,
		token,
	} satisfies AuthorizePayload);
	return new URL(`https://${Config.HOST}/unsubscribe?${searchParams}`);
};

export const getUnsubLink = async (tx: Pick<typeof db, "token">, address: string) => {
	const { temporaryToken, expiration } = await getVerificationToken(tx, address);
	const link = unsubLink({ email: address, token: temporaryToken });
	return { link, expiration };
};

const sendVerificationEmail = async (tx: Pick<typeof db, "message" | "token">, address: string): Promise<void> => {
	const { link: unsubscribeLink, expiration } = await getUnsubLink(tx, address);
	const verifyLink = new URL(`https://${Config.HOST}/verify?${unsubscribeLink.searchParams.toString()}`);
	await enqueue(tx, {
		address,
		subject: "Confirm your email address",
		html: `<a href="${verifyLink.toString()}">Click this link to verify</a> or <a href="${unsubscribeLink.toString()}">Click this link to unsubscribe</a>`,
		expiration,
	});
};

const isValid = (
	token: (Token & { email: { address: string } }) | null,
	address: string,
): token is NonNullable<typeof token> =>
	token !== null && token.valid && token.expiration >= new Date() && token.email.address === address;

export const getVerificationToken = async (
	tx: Pick<typeof db, "token">,
	address: string,
): Promise<{ expiration: Date; temporaryToken: string }> => {
	const expiration = DateTime.now().plus({ minute: Config.VERIFY_TOKEN_EXPIRATION_DAYS }).toJSDate();
	const existingToken = await tx.token.findFirst({
		where: {
			type: TokenType.VERIFY,
			email: {
				address,
			},
			temporaryToken: { notIn: null },
			valid: true,
			expiration: {
				gt: new Date(),
			},
		},
		select: {
			id: true,
			temporaryToken: true,
		},
	});
	if (existingToken && existingToken.temporaryToken) {
		await tx.token.update({
			where: {
				id: existingToken.id,
			},
			data: {
				expiration,
			},
		});
		return { temporaryToken: existingToken.temporaryToken, expiration };
	} else {
		const temporaryToken = randomUUID();
		await tx.token.create({
			data: {
				type: TokenType.VERIFY,
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
		return { temporaryToken, expiration };
	}
};

export const startVerification = async (tx: Pick<typeof db, "token" | "message">, address: string) => {
	await sendVerificationEmail(tx, address);
};

export const completeVerification = async ({
	email: address,
	temporaryToken,
	subscribed,
}: {
	email: string;
	temporaryToken: string;
	subscribed: boolean;
}) =>
	db.$transaction(async (tx) => {
		const token = await tx.token.findUnique({
			where: {
				type: TokenType.VERIFY,
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
			throw new Error("Token is not valid");
		}

		if (token.email.confirmed === false || !subscribed) {
			await tx.email.update({
				where: {
					address,
				},
				data: {
					confirmed: true,
					subscribed,
				},
			});
		}
	});

export const login = ({ email: address, protocol, redirect }: { email: string; protocol: string; redirect?: string }) =>
	db.$transaction(async (tx) => {
		const temporaryToken = randomUUID();
		const expiration = DateTime.now().plus({ minute: Config.LOGIN_TOKEN_EXPIRATION_MIN }).toJSDate();
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
		await sendConfirmationEmail(tx, { address, temporaryToken, protocol, expiration, redirect }).catch(() => {});
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
