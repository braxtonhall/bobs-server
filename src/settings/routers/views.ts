import express from "express";
import Config from "../../Config";
import { parse } from "../../parse";
import { settingsSchema } from "../../schema";
import { match, P } from "ts-pattern";
import { Ok } from "../../types/result";
import emails from "../../toolbox/storage/emails";

export const views = express()
	.get("/", (req, res) =>
		res.render("pages/settings", {
			subscribed: res.locals.email.subscribed,
			error: "",
			success: "",
			Config,
		}),
	)
	.post("/", async (req, res) => {
		const result = parse(settingsSchema, req.body);
		return match(result)
			.with(Ok(P.select()), async ({ subscribed }) => {
				await emails.updateSettings(res.locals.email.id, subscribed);
				return res.render("pages/settings", { subscribed, error: "", success: "saved", Config });
			})
			.otherwise(() =>
				res.render("pages/settings", {
					subscribed: res.locals.email.subscribed,
					error: "that didn't work",
					success: "",
					Config,
				}),
			);
	});
