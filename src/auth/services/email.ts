import Config from "../../Config";

import sendgrid from "@sendgrid/mail";
import { AuthorizePayload } from "../schemas";
sendgrid.setApiKey(Config.SENDGRID_API_KEY);

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
	if (Config.EMAIL_DISABLED) {
		console.log(url.toString());
	} else {
		await sendgrid
			.send({
				to: address,
				from: "donotreply@mail.bobs-server.net", // Change to your verified sender
				subject: "One Time Password",
				text: "Testing out sendgrid",
				html: `<a href="${url.toString()}">Click this link to log in</a>`,
			})
			.catch(console.error);
	}
};
