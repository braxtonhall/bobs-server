import { db, transaction } from "../../db";
import { SeasonState } from "../SeasonState";

type Environment = {
	seasonId: string;
	recipientId: string;
};

export const leaveGame = ({ seasonId, recipientId }: Environment) =>
	transaction(async () => {
		const entry = await db.entry.deleteMany({
			where: {
				recipientId,
				season: {
					id: seasonId,
					state: SeasonState.SIGN_UP,
				},
			},
		});
		if (entry.count === 0) {
			throw new Error("Could not find a game in sign-up to leave");
		}
	});
