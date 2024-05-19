import express from "express";
import { authorize, login } from "../operations";

const apiAuthRouter = express.Router();

apiAuthRouter.post("/authorize", async (req, res) => {
	try {
		// TODO this should only apply to api.bobs-server.net
		//  and instead should use a COOKIE if part of the website view
		const token = await authorize(req.body as { email: string; temporaryToken: string }); // TODO use a schema/parser
		return res.json({ token });
	} catch {
		return res.sendStatus(401);
	}
});

apiAuthRouter.post("/login", async (req, res) =>
	login({ email: req.body.email, protocol: req.protocol }) // TODO use a schema/parser
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(400)),
);

export { apiAuthRouter };
