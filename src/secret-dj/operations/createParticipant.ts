import { Participant } from "@prisma/client";
import { db } from "../../db";

type Environment = {
	emailId: string;
	name: string;
};

// at the time of creating a participant, user is already authed (has an email the database knows about)
export const createParticipant = async ({ emailId, name }: Environment): Promise<Participant> =>
	await db.participant.create({
		data: {
			emailId,
			name,
		},
	});
