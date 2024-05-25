import Config from "../../Config";

import { AuthorizePayload } from "../schemas";
import { enqueue } from "../../email";
import { db } from "../../db";

export const sendConfirmationEmail = async ({
	address,
	temporaryToken,
	protocol,
}: {
	address: string;
	temporaryToken: string;
	protocol: string;
}): Promise<void> => {
	const searchParams = new URLSearchParams({ email: address, token: temporaryToken } satisfies AuthorizePayload);
	const url = new URL(`${protocol}://${Config.HOST}/authorize?${searchParams}`);
	await enqueue(db, {
		address,
		subject: "One Time Password",
		text: "Click this link to log in",
		html: `<a href="${url.toString()}">Click this link to log in</a>`,
	});
};
