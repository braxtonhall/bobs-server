import sendgrid from "@sendgrid/mail";
import Config from "./Config";
import { Message as PrismaMessage } from "@prisma/client";
import { db } from "./db";
import { setTimeout } from "timers/promises";

sendgrid.setApiKey(Config.SENDGRID_API_KEY);

export type Message = Omit<PrismaMessage, "id" | "expiration"> & Partial<Pick<PrismaMessage, "expiration">>;

export const enqueue = async (client: Pick<typeof db, "message">, ...messages: Message[]): Promise<void> => {
	await client.message.createMany({ data: messages });
	console.log(new Date().toLocaleString(), `Enqueuing ${messages.length} messages`);
};

const locks = new Set<number>();

export const sendQueuedMessages = async (errorDelay = 1000) => {
	try {
		console.log(new Date().toLocaleString(), `Dequeue message begin`);
		const message = await db.message.findFirst({ orderBy: { id: "asc" } });
		if (message) {
			console.log(new Date().toLocaleString(), `Pulled ${message.address} off the queue`);
			if (!locks.has(message.id)) {
				try {
					console.log(new Date().toLocaleString(), `Locking message ${message.address}`);
					locks.add(message.id);
					if (message.expiration === null || message.expiration >= new Date()) {
						await sendMessage(message);
						console.log(new Date().toLocaleString(), "Message for", message.address, "sent!");
					} else {
						console.log(new Date().toLocaleString(), "Message for", message.address, "has expired");
					}
					await db.message.deleteMany({ where: { id: message.id } });
					setImmediate(sendQueuedMessages);
				} catch (error) {
					console.error(new Date().toLocaleString(), "Unexpected error", error);
					await setTimeout(errorDelay);
					setImmediate(sendQueuedMessages, errorDelay * 2);
				} finally {
					console.log(new Date().toLocaleString(), `Unlocking message ${message.address}`);
					locks.delete(message.id);
				}
			} else {
				console.log(new Date().toLocaleString(), `Message ${message.address} is already being serviced`);
			}
		} else {
			console.log(new Date().toLocaleString(), `Nothing to dequeue`);
		}
	} catch (error) {
		// Do nothing
		console.log(new Date().toLocaleString(), `Failed`, error);
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
					console.log(new Date().toLocaleString(), "Bad request at", message.address);
				} else {
					throw error;
				}
			});
	}
};
