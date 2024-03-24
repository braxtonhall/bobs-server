import express, { Request, Response } from "express";
import posts from "../storage/posts";
import posters from "../storage/posters";
import { match, P } from "ts-pattern";
import { Err, Ok } from "../types/result";
import { Failure } from "../types/failure";

export const authenticatedRouter = express.Router();

const _killProcedure = (dead: boolean) => async (req: Request<{ id: string }>, res: Response) =>
	// TODO even better would be to wrap those in a transaction...
	match(await posts.setDeadAndGetPosterId(req.params.id, "TODO email address", dead))
		.with(Ok(P.select()), async (posterId) => {
			// this is a hack because prisma does not support querying based on relation
			await posters.updateKarma(posterId);
			return res.sendStatus(200);
		})
		.with(Err(Failure.MISSING_DEPENDENCY), () => res.sendStatus(404))
		.with(Err(Failure.UNAUTHORIZED), () => res.sendStatus(401))
		.exhaustive();

// TODO authentication...
// https://github.com/jaredhanson/passport-local/tree/master
// https://www.passportjs.org/
// TODO need a way to create a box, get my boxes, mark box as deleted
// https://arpadt.com/articles/dynamic-origin-http-api

// const authenticatedRouter = express.Router()
// 	.post(
// 		"/posts/:id/kill",
// 		killProcedure(true),
// 	)
// 	.post(
// 		"/posts/:id/unkill",
// 		killProcedure(true),
// 	);
