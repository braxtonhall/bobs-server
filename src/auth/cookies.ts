import { Response } from "express";
import { Duration } from "luxon";
import Config from "../Config";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const setAuthCookies = (
	res: Response,
	{ accessToken, refreshToken }: { accessToken: string; refreshToken: string },
) => {
	res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: Duration.fromObject({ minute: Config.ACCESS_TOKEN_EXPIRATION_MIN }).toMillis(),
	});
	res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: Duration.fromObject({ day: Config.REFRESH_TOKEN_EXPIRATION_DAYS }).toMillis(),
	});
};

export const clearAuthCookies = (res: Response) => {
	res.clearCookie(ACCESS_TOKEN_COOKIE);
	res.clearCookie(REFRESH_TOKEN_COOKIE);
	res.clearCookie("token");
};
