import { Email, Token } from "@prisma/client";
import { decode, encode } from "./token.js";
import { db, transaction } from "../db.js";
import { TokenType } from "./TokenType.js";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import Config from "../Config.js";
import { AuthorizePayload } from "./schemas.js";
import { EmailPersona, enqueue, sendQueuedMessages } from "../email.js";
import { hashAddress } from "../util/hashAddress.js";

type Confirmation = {
	address: string;
	temporaryToken: string;
	expiration: Date;
	next?: string;
};

const sendConfirmationEmail = async (confirmation: Confirmation): Promise<void> => {
	const searchParams = new URLSearchParams({
		email: confirmation.address,
		token: confirmation.temporaryToken,
		...(typeof confirmation.next === "string" && { next: confirmation.next }),
	} satisfies AuthorizePayload);
	const url = new URL(`https://${Config.HOST}/authorize?${searchParams}`);
	await enqueue({
		persona: EmailPersona.BOBS_MAILER,
		address: confirmation.address,
		subject: "Your one time password for Bob's Server",
		html: `<a href="${url.toString()}">Click this link to log in</a>, or use the following sequence as your password:
<br />
<code>${confirmation.temporaryToken}</code>`,
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

export const getUnsubLink = async (address: string) => {
	const { temporaryToken, expiration } = await getVerificationToken(address);
	const link = unsubLink({ email: address, token: temporaryToken });
	return { link, expiration };
};

export const startVerificationForReplies = async (address: string): Promise<void> => {
	const { link: unsubscribeLink, expiration } = await getUnsubLink(address);
	const verifyLink = new URL(`https://${Config.HOST}/verify?${unsubscribeLink.searchParams.toString()}`);
	await enqueue({
		address,
		persona: EmailPersona.BOBS_MAILER,
		subject: "Please verify your email address",
		html: `You are receiving this email because a comment has been posted using your email address.

Verify your address by clicking <a href="${verifyLink.toString()}">this link</a> to get notified when someone replies to your message.
To unsubscribe from all emails from bob's server, <a href="${unsubscribeLink.toString()}">click here</a>`,
		expiration,
	});
};

export const startVerificationForSubscription = async (address: string): Promise<void> => {
	const { link: unsubscribeLink, expiration } = await getUnsubLink(address);
	const verifyLink = new URL(`https://${Config.HOST}/verify?${unsubscribeLink.searchParams.toString()}`);
	await enqueue({
		address,
		persona: EmailPersona.BOBS_MAILER,
		subject: "Please verify your email address",
		html: `You are receiving this email because this email has requested to subscribe to a comment box.

Verify your address by clicking <a href="${verifyLink.toString()}">this link</a> to get notified when new posts are created.
To unsubscribe from all emails from bob's server, <a href="${unsubscribeLink.toString()}">click here</a>`,
		expiration,
	});
};

const isValid = (token: Token | null): token is Token =>
	token !== null && token.valid && token.expiration >= new Date();

export const getVerificationToken = async (address: string): Promise<{ expiration: Date; temporaryToken: string }> => {
	const expiration = DateTime.now().plus({ day: Config.VERIFY_TOKEN_EXPIRATION_DAYS }).toJSDate();
	const existingToken = await db.token.findFirst({
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
		await db.token.update({
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
		await db.token.create({
			data: {
				type: TokenType.VERIFY,
				temporaryToken,
				expiration,
				email: {
					connectOrCreate: {
						where: { address },
						create: { address, gravatar: hashAddress(address) },
					},
				},
			},
		});
		return { temporaryToken, expiration };
	}
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
	transaction(async () => {
		const token = await db.token.findUnique({
			where: {
				type: TokenType.VERIFY,
				temporaryToken,
				email: {
					address,
				},
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

		if (!isValid(token)) {
			throw new Error("Token is not valid");
		}

		if (token.email.confirmed === false || !subscribed) {
			await db.email.update({
				where: {
					address,
				},
				data: {
					confirmed: true,
					subscribed,
				},
			});
		}
		if (!subscribed) {
			await db.token.update({
				where: { id: token.id },
				data: { valid: false },
			});
		}
	});

export const login = async ({ email: address, next }: { email: string; next?: string }) => {
	await transaction(async () => {
		const expiration = DateTime.now().plus({ minute: Config.LOGIN_TOKEN_EXPIRATION_MIN }).toJSDate();
		const existing = await db.token.count({
			where: {
				type: TokenType.LOGIN,
				expiration: { gte: expiration },
				email: { address },
			},
		});
		if (existing > Config.MAX_ACTIVE_LOGIN_TOKENS) {
			throw new Error("Too many active login tokens");
		}
		const temporaryToken = randomUUID();
		const { email } = await db.token.create({
			data: {
				type: TokenType.LOGIN,
				temporaryToken,
				expiration,
				email: {
					connectOrCreate: {
						where: { address },
						create: { address, gravatar: hashAddress(address) },
					},
				},
			},
			select: {
				email: {
					select: {
						address: true,
					},
				},
			},
		});
		await sendConfirmationEmail({ address: email.address, temporaryToken, expiration, next }).catch(() => {});
	});
	void sendQueuedMessages();
};

export const authorize = ({
	email: address,
	temporaryToken,
}: {
	email: string;
	temporaryToken: string;
}): Promise<string> =>
	transaction(async () => {
		const token = await db.token.findUnique({
			where: {
				type: TokenType.LOGIN,
				temporaryToken,
				email: {
					address,
				},
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

		if (!isValid(token)) {
			throw new Error("Token is not valid");
		}

		const apiToken = await db.token.create({
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
			(await db.email.update({
				where: {
					address,
				},
				data: {
					confirmed: true,
				},
			}));

		await db.token.update({
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
