import express from "express";
import { authorize, login } from "../operations";
import { authorizePayloadSchema, loginPayloadSchema } from "../schemas";

const apiAuthRouter = express.Router();

apiAuthRouter.post("/authorize", async (req, res) => {
	const result = authorizePayloadSchema.safeParse(req.body);
	if (!result.success) {
		return res.sendStatus(400);
	}
	try {
		// TODO this should only apply to api.bobs-server.net
		const token = await authorize({ email: result.data.email, temporaryToken: result.data.token });
		return res.json({ token }).sendStatus(200);
	} catch {
		return res.sendStatus(401);
	}
});

apiAuthRouter.post("/login", async (req, res) => {
	try {
		const { email } = loginPayloadSchema.parse(req.body);
		await login({ email, protocol: req.protocol });
		return res.sendStatus(200);
	} catch {
		return res.sendStatus(400);
	}
});

export { apiAuthRouter };
