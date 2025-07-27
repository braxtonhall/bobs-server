import Config from "./Config";
import { Message as PrismaMessage } from "@prisma/client";
import { db } from "./db";
import { setTimeout } from "timers/promises";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const brevo = require("@getbrevo/brevo") as typeof import("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(0 as any, Config.BREVO_API_KEY);

export enum EmailPersona {
	SECRET_DJ = "secret dj housemaster 💿",
	BOBS_MAILER = "Bob's Mailer",
}

export type Message = Omit<PrismaMessage, "id" | "expiration" | "persona"> &
	Partial<Pick<PrismaMessage, "expiration">> & { persona: EmailPersona };

export const enqueue = async (...messages: Message[]): Promise<void> => {
	await db.message.createMany({ data: messages });
};

const locks = new Set<number>();

export const sendQueuedMessages = async (errorDelay = 1000) => {
	try {
		const message = await db.message.findFirst({ orderBy: { id: "asc" } });
		if (message) {
			if (!locks.has(message.id)) {
				try {
					locks.add(message.id);
					if (message.expiration === null || message.expiration >= new Date()) {
						await sendMessage(message);
					} else {
						console.log("Message for", message.address, "has expired");
					}
					await db.message.deleteMany({ where: { id: message.id } });
					setImmediate(sendQueuedMessages);
				} catch (error) {
					console.error("Unexpected error", error);
					await setTimeout(errorDelay);
					setImmediate(sendQueuedMessages, errorDelay * 2);
				} finally {
					locks.delete(message.id);
				}
			}
		}
	} catch {
		// Do nothing
	}
};

const sendMessage = async (message: PrismaMessage): Promise<void> => {
	if (Config.EMAIL_DISABLED) {
		console.log(message);
	} else {
		const sendSmtpEmail = new brevo.SendSmtpEmail();
		sendSmtpEmail.sender = { name: message.persona, email: Config.EMAIL_FROM };
		sendSmtpEmail.to = [{ email: message.address }];
		sendSmtpEmail.subject = message.subject;
		sendSmtpEmail.htmlContent = message.html;

		await apiInstance.sendTransacEmail(sendSmtpEmail).catch((error: any) => {
			if (error?.code === 400) {
				console.log("Bad request at", message.address);
			} else {
				throw error;
			}
		});
	}
};
