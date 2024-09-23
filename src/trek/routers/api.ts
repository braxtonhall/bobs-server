import express from "express";
import { authenticateHeader } from "../../auth/middlewares/authenticate";
import { getViewing } from "../middlewares/checkViewing";
import { db } from "../../db";

// TODO this is how you log an episode

export const api = express()
	.use(authenticateHeader)
	.use(getViewing)
	.use((req, res, next) => {
		if (!res.locals.logged) {
			return res.sendStatus(403);
		} else if (!res.locals.viewing) {
			return res.sendStatus(401);
		} else {
			return next();
		}
	})
	.get("/episodes", async (_req, res) => {
		const series = await db.series.findMany();
		const episodes = await db.episode.findMany({
			include: {
				views: {
					where: {
						viewer: res.locals.viewer,
					},
				},
			},
		});

		return res.send({ episodes, series: Object.fromEntries(series.map((series) => [series.id, series])) });
	});
