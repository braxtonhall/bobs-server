import { Request } from "express";

type Environment = {
	req: Request;
	error?: string;
	success?: string;
};

// there is a req.session.destroy api but it's callback based
// and i don't want to nest the redirects in a callback for sessions
// there's only really 2 pieces of data in the session, so we can clear them ourselves manually
const clearMessages = (req: Request) => {
	req.session.error = null;
	req.session.success = null;
};

export const clearMessagesAndSet = ({ req, error, success }: Environment) => {
	clearMessages(req);

	if (error) {
		req.session.error = error;
	}
	if (success) {
		req.session.success = success;
	}
};

export const getMessagesAndClear = (req: Request) => {
	const { error, success } = req.session;
	clearMessages(req);
	return { error: error ?? "", success: success ?? "" };
};
