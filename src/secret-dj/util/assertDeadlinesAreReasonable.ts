import { Deadlines } from "../schemas";
import { DateTime } from "luxon";
import Config from "../../Config";

export const assertDeadlinesAreReasonable = ({ hardDeadline, softDeadline }: Deadlines) => {
	if (softDeadline === null) {
		if (hardDeadline !== null) {
			throw new Error("cannot have a hard deadline without a soft deadline");
		}
		return;
	}
	if (softDeadline < DateTime.now().plus({ day: Config.MINIMUM_GAME_DAYS }).toJSDate()) {
		throw new Error("soft deadline is too soon");
	}
	if (
		hardDeadline &&
		hardDeadline < DateTime.fromJSDate(softDeadline).plus({ day: Config.MINIMUM_GRACE_DAYS }).toJSDate()
	) {
		throw new Error("hard deadline is too close to the soft deadline");
	}
};
