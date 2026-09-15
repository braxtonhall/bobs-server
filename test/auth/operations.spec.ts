import { db } from "../../src/db";
import { createTestData, dropTables } from "../util";
import { authorize, deauthenticate, login, rotateRefreshToken, verifyAccessToken } from "../../src/auth/operations";
import { TokenType } from "../../src/auth/TokenType";
import * as time from "jest-date-mock";
import Config from "../../src/Config";

describe("auth operations", () => {
	const address = "auth-operations-test@bob.com";

	beforeAll(async () => {
		await dropTables();
		await createTestData(address);
	});
	beforeEach(time.clear);
	afterEach(() => db.token.deleteMany());

	const getLoginTemporaryToken = async (): Promise<string> => {
		const token = await db.token.findFirstOrThrow({
			where: { type: TokenType.LOGIN, email: { address } },
		});
		return token.temporaryToken as string;
	};

	const authorizeTestUser = async () => {
		await login({ email: address });
		const temporaryToken = await getLoginTemporaryToken();
		return authorize({ email: address, temporaryToken });
	};

	describe("login -> authorize", () => {
		it("issues an access token and a refresh token", async () => {
			const { accessToken, refreshToken } = await authorizeTestUser();
			expect(accessToken).toEqual(expect.any(String));
			expect(refreshToken).toEqual(expect.any(String));
		});

		it("the access token decodes to the correct claims with no DB access required", async () => {
			const { accessToken } = await authorizeTestUser();
			const claims = verifyAccessToken(accessToken);
			expect(claims).toEqual({ id: expect.any(String), address, subscribed: expect.any(Boolean) });
		});
	});

	describe("rotateRefreshToken", () => {
		it("returns fresh tokens and invalidates the old refresh token row", async () => {
			const { refreshToken } = await authorizeTestUser();
			const rotated = await rotateRefreshToken(refreshToken);
			expect(rotated.refreshToken).not.toEqual(refreshToken);

			const oldRow = await db.token.findUniqueOrThrow({ where: { temporaryToken: refreshToken } });
			expect(oldRow.valid).toBe(false);

			const newRow = await db.token.findUniqueOrThrow({ where: { temporaryToken: rotated.refreshToken } });
			expect(newRow.familyId).toEqual(oldRow.familyId);
		});

		it("rejects and invalidates the entire family when a rotated-out token is reused", async () => {
			const { refreshToken } = await authorizeTestUser();
			await rotateRefreshToken(refreshToken);

			await expect(rotateRefreshToken(refreshToken)).rejects.toThrow();

			const oldRow = await db.token.findUniqueOrThrow({ where: { temporaryToken: refreshToken } });
			const family = await db.token.findMany({
				where: { familyId: oldRow.familyId, type: TokenType.REFRESH },
			});
			expect(family.length).toBeGreaterThan(1);
			expect(family.every((row) => row.valid === false)).toBe(true);
		});

		it("rejects an expired refresh token", async () => {
			const { refreshToken } = await authorizeTestUser();
			// +3h buffer clears any DST skew between Luxon's calendar-day `.plus()` (used to compute the
			// stored expiration) and jest-date-mock's raw millisecond `advanceBy`.
			time.advanceBy((Config.REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 + 3 * 60 * 60) * 1000);
			await expect(rotateRefreshToken(refreshToken)).rejects.toThrow();
		});

		it("rejects an unrecognized refresh token", async () => {
			await expect(rotateRefreshToken("not-a-real-token")).rejects.toThrow();
		});
	});

	describe("deauthenticate", () => {
		it("invalidates the refresh token so it can no longer be rotated", async () => {
			const { refreshToken } = await authorizeTestUser();
			await deauthenticate(refreshToken);
			await expect(rotateRefreshToken(refreshToken)).rejects.toThrow();
		});

		it("is idempotent for an unrecognized refresh token", async () => {
			await expect(deauthenticate("not-a-real-token")).resolves.toBeUndefined();
		});
	});
});
