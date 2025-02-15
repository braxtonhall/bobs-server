import jwt from "jsonwebtoken";
import Config from "../Config.js";

const encode = (tokenId: number): string =>
	jwt.sign({ id: tokenId }, Config.JWT_SECRET, {
		algorithm: "HS256",
		noTimestamp: true,
	});

const decode = (token: string): number => (jwt.verify(token, Config.JWT_SECRET) as any).id;

export { encode, decode };
