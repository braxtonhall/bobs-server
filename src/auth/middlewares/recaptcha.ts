import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import axios from "axios";
import Config from "../../Config";

const RESPONSE_KEY = "g-recaptcha-response";

const recaptchaPayloadSchema = z.object({
	[RESPONSE_KEY]: z.string().nonempty(),
});

export const recaptcha = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { [RESPONSE_KEY]: response } = recaptchaPayloadSchema.parse(req.body);
		const { data } = await axios.post(
			"https://www.google.com/recaptcha/api/siteverify",
			{
				secret: Config.RECAPTCHA_SECRET_KEY,
				response,
				remoteip: req.ip,
			},
			{ headers: { "Content-Type": "application/x-www-form-urlencoded" } },
		);
		if (data?.success) {
			return next();
		}
	} catch {
		// do nothing
	}
	return res.sendStatus(400);
};
