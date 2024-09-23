import express from "express";
import { authenticateHeader } from "../../auth/middlewares/authenticate";
import { getViewing } from "../middlewares/checkViewing";
import { getContent } from "../operations/getContent";

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
	.get("/content", async (_req, res) => res.send(await getContent(res.locals.viewer)));
