import { db } from "../../src/db";
import { createTestData, dropTables } from "../util";
import { exchangeSsoCode, isAllowedRedirect, isExchangeAuthorized, issueSsoCode } from "../../src/auth/sso";
import * as time from "jest-date-mock";
import Config from "../../src/Config";

describe("sso", () => {
	const address = "sso-test@bob.com";
	const redirect = Config.SSO_REDIRECTS[0];
	let emailId: string;

	beforeAll(async () => {
		await dropTables();
		({ emailId } = await createTestData(address));
	});
	beforeEach(time.clear);
	afterEach(() => db.token.deleteMany());

	it("is configured by the sample env", () => {
		expect(redirect).toEqual(expect.any(String));
		expect(Config.SSO_EXCHANGE_SECRET).toEqual(expect.any(String));
	});

	describe("isAllowedRedirect", () => {
		it("accepts exactly the allowlisted URLs", () => {
			expect(isAllowedRedirect(redirect)).toBe(true);
			expect(isAllowedRedirect(`${redirect}/`)).toBe(false);
			expect(isAllowedRedirect(`${redirect}?next=x`)).toBe(false);
			expect(isAllowedRedirect("https://evil.example/operator/callback")).toBe(false);
		});
	});

	describe("isExchangeAuthorized", () => {
		it("requires the bearer secret", () => {
			expect(isExchangeAuthorized(`Bearer ${Config.SSO_EXCHANGE_SECRET}`)).toBe(true);
			expect(isExchangeAuthorized(`Bearer ${Config.SSO_EXCHANGE_SECRET}x`)).toBe(false);
			expect(isExchangeAuthorized(Config.SSO_EXCHANGE_SECRET)).toBe(false);
			expect(isExchangeAuthorized(undefined)).toBe(false);
		});
	});

	describe("issue -> exchange", () => {
		it("returns the identity the code was issued to", async () => {
			const code = await issueSsoCode({ emailId, redirect });
			expect(await exchangeSsoCode({ code, redirect })).toEqual({ sub: emailId, email: address });
		});

		it("issues a different code each time", async () => {
			const first = await issueSsoCode({ emailId, redirect });
			const second = await issueSsoCode({ emailId, redirect });
			expect(first).not.toEqual(second);
		});

		it("can only be exchanged once", async () => {
			const code = await issueSsoCode({ emailId, redirect });
			await exchangeSsoCode({ code, redirect });
			await expect(exchangeSsoCode({ code, redirect })).rejects.toThrow();
		});

		it("rejects another redirect, and spends the code doing so", async () => {
			const code = await issueSsoCode({ emailId, redirect });
			await expect(exchangeSsoCode({ code, redirect: "https://evil.example/callback" })).rejects.toThrow();
			await expect(exchangeSsoCode({ code, redirect })).rejects.toThrow();
		});

		it("rejects an expired code", async () => {
			const code = await issueSsoCode({ emailId, redirect });
			time.advanceBy((Config.SSO_CODE_EXPIRATION_SEC + 1) * 1000);
			await expect(exchangeSsoCode({ code, redirect })).rejects.toThrow();
		});

		it("rejects codes it never issued", async () => {
			await expect(exchangeSsoCode({ code: "made-up", redirect })).rejects.toThrow();
		});

		it("does not accept other kinds of token as a code", async () => {
			await db.token.create({
				data: {
					type: "login",
					temporaryToken: "a-login-token",
					expiration: new Date(Date.now() + 60_000),
					email: { connect: { id: emailId } },
				},
			});
			await expect(exchangeSsoCode({ code: "a-login-token", redirect })).rejects.toThrow();
		});
	});
});
