import sendgrid from "@sendgrid/mail";
import Config from "./Config";
import { Message as PrismaMessage } from "@prisma/client";
import { db } from "./db";
import { setTimeout } from "timers/promises";

sendgrid.setApiKey(Config.SENDGRID_API_KEY);

export type Message = Omit<PrismaMessage, "id" | "expiration"> & Partial<Pick<PrismaMessage, "expiration">>;

export const enqueue = async (client: Pick<typeof db, "message">, ...messages: Message[]): Promise<void> => {
	await client.message.createMany({ data: messages });
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

const sendMessage = async (message: Message): Promise<void> => {
	if (Config.EMAIL_DISABLED) {
		console.log(message);
	} else {
		await sendgrid
			.send({
				from: Config.EMAIL_FROM,
				to: message.address,
				subject: message.subject,
				html: message.html,
			})
			.catch((error) => {
				if (error?.code === 400) {
					console.log("Bad request at", message.address);
				} else {
					throw error;
				}
			});
	}
};
