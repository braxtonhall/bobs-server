import express from "express";
import { authenticateHeader } from "../../auth/middlewares/authenticate";
import { getViewing } from "../middlewares/checkViewing";
import { getSeries } from "../operations/getSeries";
import { getCurrentlyWatching } from "../operations/getCurrentlyWatching";
import bodyParser from "body-parser";
import { updateCursor } from "../operations/updateCursor";
import { getViewerTags } from "../operations/getViewerTags";

export const api = express()
	.post("/*", bodyParser.urlencoded({ extended: true }))
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
	.get("/watching", async (_req, res) => res.send(await getCurrentlyWatching(res.locals.viewer.id)))
	.get("/series", async (_req, res) => res.send(await getSeries()))
	.get("/tags", async (_req, res) => res.send(await getViewerTags(res.locals.viewer.id)))
	.post("/cursor", async (req, res) =>
		updateCursor({ viewerId: res.locals.viewer.id, episodeId: req.body.id }).then(
			() => res.sendStatus(200),
			() => res.sendStatus(400),
		),
	);
// TODO
//  on WATCHING page, there are two buttons: skip, watched on. both update your watchlist pointer
//  on EPISODE page, there are two buttons: seen, watched on. seen never updates your pointer. watched on
//   does iff it's the episode you are currently watching
