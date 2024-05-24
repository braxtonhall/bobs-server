import sendgrid from "@sendgrid/mail";
import Config from "./Config";
import { Message } from "@prisma/client";
import { db } from "./db";

sendgrid.setApiKey(Config.SENDGRID_API_KEY);

export const enqueue = async (...messages: Omit<Message, "id">[]): Promise<void> => {
	await db.message.createMany({ data: messages });
	void sendQueuedMessages();
};

const locks = new Set<number>();

export const sendQueuedMessages = async () => {
	try {
		const message = await db.message.findFirst({ orderBy: { id: "asc" } });
		if (message) {
			if (!locks.has(message.id)) {
				try {
					locks.add(message.id);
					await sendMessage(message);
					await db.message.delete({ where: { id: message.id } });
				} finally {
					locks.delete(message.id);
				}
			}
			setImmediate(sendQueuedMessages);
		}
	} catch {
		// Do nothing
	}
};

const sendMessage = async (message: Message): Promise<void> => {
	if (Config.EMAIL_DISABLED) {
		console.log(message);
	} else {
		await sendgrid.send({
			from: Config.EMAIL_FROM,
			to: message.address,
			subject: message.subject,
			text: message.text,
			html: message.html,
		});
	}
};
