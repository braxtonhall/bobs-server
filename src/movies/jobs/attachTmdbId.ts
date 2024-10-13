import { DateTime } from "luxon";
import { Job } from "../../jobs";
import { db } from "../../db";
import { getTmdbId } from "../letterboxd";

const SEARCH_MAX = 3;
const SEARCH_DELAY_WEEKS = 1;

const attachTmdbId = async () => {
	const now = DateTime.now();
	const movie = await db.letterboxdMovie.findFirst({
		where: {
			OR: [
				{ searchedAt: { in: null } },
				{ searchedAt: { lt: now.minus({ week: SEARCH_DELAY_WEEKS }).toJSDate() } },
			],
			searchCount: { lt: SEARCH_MAX },
			tmdbId: { in: null },
		},
	});
	if (movie) {
		const tmdbId = await getTmdbId(movie.slug);
		if (tmdbId === null) {
			await db.letterboxdMovie.update({
				where: movie,
				data: {
					searchCount: { increment: 1 },
					searchedAt: now.toJSDate(),
				},
			});
		} else {
			await db.letterboxdMovie.update({
				where: movie,
				data: {
					tmdbId,
					searchCount: 0,
					searchedAt: null,
				},
			});
		}
	}
};

export const job = {
	interval: Infinity,
	callback: () => {},
} satisfies Job;
