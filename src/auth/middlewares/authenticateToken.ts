import { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { decode } from "../token";
import { TokenType } from "../TokenType";

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
	const { authorization } = req.headers;
	if (authorization === undefined || !authorization.startsWith("Bearer ")) {
		return res.sendStatus(401);
	}
	const token = authorization.replace("Bearer ", "");

	try {
		const tokenId = decode(token);
		const dbToken = await db.token.findUnique({
			where: { id: tokenId, type: TokenType.JWT },
			include: { email: true },
		});

		if (dbToken === null || !dbToken.valid || dbToken.expiration < new Date()) {
			// TODO if invalid, just delete the token
			return res.status(401);
		}

		res.locals.email = dbToken.email;
		return next();
	} catch (e) {
		return res.sendStatus(401);
	}
};
