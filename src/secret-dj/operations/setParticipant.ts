import { Participant } from "@prisma/client";
import { db } from "../../db.js";

type Environment = {
	emailId: string;
	name: string;
};

// at the time of creating a participant, user is already authed (has an email the database knows about)
export const setParticipant = async ({ emailId, name }: Environment): Promise<Participant> =>
	await db.participant.upsert({
		where: {
			emailId,
		},
		create: {
			emailId,
			name,
		},
		update: {
			emailId,
			name,
		},
	});
