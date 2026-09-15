import * as Token from "../../src/auth/token";
import { advanceBy, clear } from "jest-date-mock";
import Config from "../../src/Config";
import jwt from "jsonwebtoken";

describe("token", () => {
	afterEach(() => clear());

	const claims = { sub: "abc", email: "bob@bob.com", subscribed: true };

	it("should be able to encode a token", () => expect(Token.encode(claims)).toEqual(expect.any(String)));

	it("should round-trip claims", () => {
		const decoded = Token.decode(Token.encode(claims));
		expect(decoded).toMatchObject(claims);
	});

	it("should include exp and iat", () => {
		const decoded = Token.decode(Token.encode(claims));
		expect(decoded.iat).toEqual(expect.any(Number));
		expect(decoded.exp).toEqual(expect.any(Number));
		expect(decoded.exp).toBeGreaterThan(decoded.iat);
	});

	it("should throw once the token has expired", () => {
		const token = Token.encode(claims);
		advanceBy((Config.ACCESS_TOKEN_EXPIRATION_MIN * 60 + 1) * 1000);
		expect(() => Token.decode(token)).toThrow(jwt.TokenExpiredError);
	});
});
