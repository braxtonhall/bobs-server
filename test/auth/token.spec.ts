import * as Token from "../../src/auth/token.js";

describe("token", () => {
	it("should be able to encode a token", () => expect(Token.encode(0)).toEqual(expect.any(String)));

	it.each([0, 1, 10, 100, 42])("should be able to decode a token for id %d", (number) =>
		expect(Token.decode(Token.encode(number))).toEqual(number),
	);
});
