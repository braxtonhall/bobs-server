import { Option, Some } from "../../types/option";
import { NextFunction, Request, Response } from "express";
import { match, P } from "ts-pattern";

export const allowOrigin =
	<Params>(getOrigin: (params: Params) => Promise<Option<string>>) =>
	async (req: Request<Params>, res: Response, next: NextFunction): Promise<unknown> =>
		match(await getOrigin(req.params))
			.with(Some(P.select()), (origin) => {
				res.header("Access-Control-Allow-Origin", origin);
				res.header("Access-Control-Allow-Credentials", "true");
				res.header(
					"Access-Control-Allow-Headers",
					"Access-Control-Allow-Headers,Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers",
				);
				return next();
			})
			.otherwise(() => next());
