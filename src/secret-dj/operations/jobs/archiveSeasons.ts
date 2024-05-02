import { checkFinishedSeasons } from "../checkFinishedSeasons";

const FOUR_HOURS = 4 * 60 * 60 * 1000;

// assumes the server will be up for at least 4 hours
export const archiveSeasons = () =>
	setInterval(() => {
		checkFinishedSeasons();
	}, FOUR_HOURS);
