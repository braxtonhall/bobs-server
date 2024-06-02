import "express-session";

// extend with our own session data
declare module "express-session" {
	interface SessionData {
		success: null | string;
		error: null | string;
	}
}
