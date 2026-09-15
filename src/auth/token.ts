import jwt from "jsonwebtoken";
import Config from "../Config";

export interface AccessTokenClaims {
	sub: string;
	email: string;
	subscribed: boolean;
}

export type AuthenticatedEmail = { id: string; address: string; subscribed: boolean };

const encode = (claims: AccessTokenClaims): string =>
	jwt.sign(claims, Config.JWT_SECRET, {
		algorithm: "HS256",
		expiresIn: Config.ACCESS_TOKEN_EXPIRATION_MIN * 60,
	});

const decode = (token: string): AccessTokenClaims & { iat: number; exp: number } =>
	jwt.verify(token, Config.JWT_SECRET) as AccessTokenClaims & { iat: number; exp: number };

export { encode, decode };
