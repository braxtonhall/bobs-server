import express from "express";
import cookieParser from "cookie-parser";
import { AddressInfo } from "net";
import { Server } from "http";
import { db } from "../../src/db";
import { createTestData, dropTables } from "../util";
import { authorize, login } from "../../src/auth/operations";
import { authenticateCookie } from "../../src/auth/middlewares/authenticate";
import { ACCESS_TOKEN_COOKIE } from "../../src/auth/cookies";
import { TokenType } from "../../src/auth/TokenType";
import { api, views } from "../../src/auth/routers/sso";
import Config from "../../src/Config";

describe("sso routes", () => {
	const address = "sso-routes-test@bob.com";
	const redirect = Config.SSO_REDIRECTS[0];
	const secret = `Bearer ${Config.SSO_EXCHANGE_SECRET}`;
	let server: Server;
	let baseUrl: string;
	let cookie: string;

	beforeAll(async () => {
		await dropTables();
		await createTestData(address);
		const app = express().use("/api", api).use(cookieParser()).use(authenticateCookie).use(views);
		server = app.listen(0);
		baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

		await login({ email: address });
		const { temporaryToken } = await db.token.findFirstOrThrow({
			where: { type: TokenType.LOGIN, email: { address } },
		});
		const { accessToken } = await authorize({ email: address, temporaryToken: temporaryToken as string });
		cookie = `${ACCESS_TOKEN_COOKIE}=${accessToken}`;
	});
	afterAll(() => new Promise((resolve) => server.close(resolve)));

	const startSso = (query: Record<string, string>, headers: Record<string, string> = { cookie }) =>
		fetch(`${baseUrl}/sso?${new URLSearchParams(query)}`, { headers, redirect: "manual" });

	const exchange = (body: unknown, authorization = secret) =>
		fetch(`${baseUrl}/api/sso/exchange`, {
			method: "POST",
			headers: { "content-type": "application/json", authorization },
			body: JSON.stringify(body),
		});

	const codeFrom = (response: Response): string => {
		const location = new URL(response.headers.get("location") as string);
		return location.searchParams.get("code") as string;
	};

	describe("GET /sso", () => {
		it("sends a logged-out visitor to log in, coming back here afterwards", async () => {
			const response = await startSso({ redirect, state: "abc" }, {});
			expect(response.status).toBe(302);
			const location = new URL(response.headers.get("location") as string, baseUrl);
			expect(location.pathname).toBe("/login");
			expect(location.searchParams.get("next")).toBe(`/sso?${new URLSearchParams({ redirect, state: "abc" })}`);
		});

		it("redirects a logged-in user back with a code and the state", async () => {
			const response = await startSso({ redirect, state: "abc" });
			expect(response.status).toBe(302);
			const location = new URL(response.headers.get("location") as string);
			expect(`${location.origin}${location.pathname}`).toBe(redirect);
			expect(location.searchParams.get("state")).toBe("abc");
			expect(location.searchParams.get("code")).toEqual(expect.any(String));
		});

		it.each([
			{ redirect: "https://evil.example/callback", state: "abc" },
			{ redirect, state: "" },
			{ redirect, state: "x".repeat(257) },
			{ state: "abc" },
		])("refuses %p without redirecting", async (query) => {
			const response = await startSso(query as Record<string, string>);
			expect(response.status).toBe(400);
			expect(response.headers.get("location")).toBeNull();
		});
	});

	describe("POST /api/sso/exchange", () => {
		it("trades a code for the identity", async () => {
			const code = codeFrom(await startSso({ redirect, state: "abc" }));
			const response = await exchange({ code, redirect });
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ sub: expect.any(String), email: address });
		});

		it("requires the secret", async () => {
			const code = codeFrom(await startSso({ redirect, state: "abc" }));
			expect((await exchange({ code, redirect }, "Bearer wrong")).status).toBe(401);
			// The failed attempt didn't spend the code.
			expect((await exchange({ code, redirect })).status).toBe(200);
		});

		it("refuses a spent code", async () => {
			const code = codeFrom(await startSso({ redirect, state: "abc" }));
			await exchange({ code, redirect });
			const response = await exchange({ code, redirect });
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "invalid_code" });
		});

		it("refuses a malformed body", async () => {
			expect((await exchange({ code: 5 })).status).toBe(400);
		});
	});
});
