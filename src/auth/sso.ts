import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { DateTime } from "luxon";
import Config from "../Config";
import { db } from "../db";
import { TokenType } from "./TokenType";

export type SsoIdentity = { sub: string; email: string };

export const ssoEnabled = (): boolean => Config.SSO_EXCHANGE_SECRET !== undefined && Config.SSO_REDIRECTS.length > 0;

export const isAllowedRedirect = (redirect: string): boolean => Config.SSO_REDIRECTS.includes(redirect);

/** Whether an `Authorization` header carries the exchange secret. Both sides are hashed so they compare in constant time. */
export const isExchangeAuthorized = (authorization: string | undefined): boolean => {
	if (Config.SSO_EXCHANGE_SECRET === undefined || authorization === undefined) {
		return false;
	}
	const digest = (value: string) => createHash("sha256").update(value).digest();
	return timingSafeEqual(digest(authorization), digest(`Bearer ${Config.SSO_EXCHANGE_SECRET}`));
};

/** Issues a single-use code that the service behind `redirect` can exchange for this email's identity. */
export const issueSsoCode = async ({ emailId, redirect }: { emailId: string; redirect: string }): Promise<string> => {
	const code = randomBytes(32).toString("base64url");
	await db.token.create({
		data: {
			type: TokenType.SSO,
			temporaryToken: code,
			redirect,
			expiration: DateTime.now().plus({ second: Config.SSO_CODE_EXPIRATION_SEC }).toJSDate(),
			email: { connect: { id: emailId } },
		},
	});
	return code;
};

/**
 * Consumes `code` and returns who it was issued to. The code is spent before `redirect` is checked,
 * so a code presented with the wrong redirect can't be tried again.
 */
export const exchangeSsoCode = async ({ code, redirect }: { code: string; redirect: string }): Promise<SsoIdentity> => {
	const { count } = await db.token.updateMany({
		where: { type: TokenType.SSO, temporaryToken: code, valid: true, expiration: { gte: new Date() } },
		data: { valid: false },
	});
	if (count !== 1) {
		throw new Error("SSO code is not valid");
	}
	const token = await db.token.findUniqueOrThrow({
		where: { temporaryToken: code },
		include: { email: { select: { id: true, address: true } } },
	});
	if (token.redirect !== redirect) {
		throw new Error("SSO code was issued for another redirect");
	}
	return { sub: token.email.id, email: token.email.address };
};
