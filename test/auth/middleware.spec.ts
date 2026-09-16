import { Request, Response } from "express";
import { authenticateCookie } from "../../src/auth/middlewares/authenticate";
import { authorize, login } from "../../src/auth/operations";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../../src/auth/cookies";
import { TokenType } from "../../src/auth/TokenType";
import { db } from "../../src/db";
import { createTestData, dropTables } from "../util";
import * as time from "jest-date-mock";
import Config from "../../src/Config";

describe("authenticateCookie middleware", () => {
	const address = "auth-middleware-test@bob.com";

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

	const issueTokens = async () => {
		await login({ email: address });
		const temporaryToken = await getLoginTemporaryToken();
		return authorize({ email: address, temporaryToken });
	};

	const mockResponse = () =>
		({ locals: {}, cookie: jest.fn(), clearCookie: jest.fn() }) as unknown as Response & {
			cookie: jest.Mock;
			clearCookie: jest.Mock;
		};

	it("authenticates a valid access token without touching cookies", async () => {
		const { accessToken } = await issueTokens();
		const req = { cookies: { [ACCESS_TOKEN_COOKIE]: accessToken } } as unknown as Request;
		const res = mockResponse();
		const next = jest.fn();

		await authenticateCookie(req, res, next);

		expect(res.locals.logged).toBe(true);
		expect(res.locals.email).toMatchObject({ address });
		expect(res.cookie).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalled();
	});

	it("silently rotates and re-issues both cookies when the access token is expired but the refresh token is valid", async () => {
		const { accessToken, refreshToken } = await issueTokens();
		time.advanceBy((Config.ACCESS_TOKEN_EXPIRATION_MIN * 60 + 1) * 1000);

		const req = {
			cookies: { [ACCESS_TOKEN_COOKIE]: accessToken, [REFRESH_TOKEN_COOKIE]: refreshToken },
		} as unknown as Request;
		const res = mockResponse();
		const next = jest.fn();

		await authenticateCookie(req, res, next);

		expect(res.locals.logged).toBe(true);
		expect(res.locals.email).toMatchObject({ address });
		expect(res.cookie).toHaveBeenCalledTimes(2);
		expect(res.cookie.mock.calls[0][2]).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax" });
		expect(res.cookie.mock.calls[1][2]).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax" });
		expect(next).toHaveBeenCalled();
	});

	it("logs out and clears cookies when both the access and refresh tokens are unusable", async () => {
		const req = {
			cookies: { [ACCESS_TOKEN_COOKIE]: "garbage", [REFRESH_TOKEN_COOKIE]: "garbage" },
		} as unknown as Request;
		const res = mockResponse();
		const next = jest.fn();

		await authenticateCookie(req, res, next);

		expect(res.locals.logged).toBe(false);
		expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
		expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);
		expect(next).toHaveBeenCalled();
	});

	it("logs out without touching cookies when there is simply no session", async () => {
		const req = { cookies: {} } as unknown as Request;
		const res = mockResponse();
		const next = jest.fn();

		await authenticateCookie(req, res, next);

		expect(res.locals.logged).toBe(false);
		expect(res.clearCookie).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalled();
	});
});
