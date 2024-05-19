import Config from "../../Config";

import sendgrid from "@sendgrid/mail";
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
	// TODO Tie this to the type of the parser used in /authenticate
	const searchParams = new URLSearchParams({ email: address, token: temporaryToken });
	const url = new URL(`${protocol}://${Config.HOST}/authorize?${searchParams}`);
	await sendgrid
		.send({
			to: address,
			from: "donotreply@mail.bobs-server.net", // Change to your verified sender
			subject: "One Time Password",
			text: "Testing out sendgrid",
			html: `<a href="${url.toString()}">Click this link to log in</a>`,
		})
		.catch(console.error);
};
