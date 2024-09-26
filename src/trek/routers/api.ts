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

// TODO
//  on WATCHING page, there are two buttons: skip, watched on. both update your watchlist pointer
//  on EPISODE page, there are two buttons: seen, watched on. seen never updates your pointer. watched on
//   does iff it's the episode you are currently watching
