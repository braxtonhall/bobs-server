import { db } from "../../db";
import { DateTime } from "luxon";
import { guessMovie } from "../adapters/tmdb";

const SEARCH_MAX = 3;
const SEARCH_DELAY_WEEKS = 1;

const guessMovies = async () => {
	const now = DateTime.now();
	const screener = await db.screener.findFirst({
		where: {
			OR: [
				{ searchedAt: { in: null } },
				{ searchedAt: { lt: now.minus({ week: SEARCH_DELAY_WEEKS }).toJSDate() } },
			],
			searchCount: { lt: SEARCH_MAX },
			tmdbId: { in: null },
		},
	});

	if (screener) {
		const guess = await guessMovie(screener.name, screener.year === -1 ? undefined : screener.year);
		if (guess) {
			const spokenLanguages = {
				connectOrCreate: guess.spoken_languages.map((language) => ({
					where: {
						id: language.iso_639_1,
					},
					create: {
						id: language.iso_639_1,
					},
				})),
			};
			const movie = {
				tmdbId: guess.id,
				title: guess.title,
				spokenLanguages,
				collectionId: guess.belongs_to_collection?.id,
				imdbId: guess.imdb_id,
				posterPath: guess.poster_path,
				tagline: guess.tagline,
				backdropPath: guess.backdrop_path,
				primaryLanguage: {
					connectOrCreate: {
						where: {
							id: guess.original_language,
						},
						create: {
							id: guess.original_language,
						},
					},
				},
				updatedAt: now.toJSDate(),
			};
			await db.movie.upsert({
				where: { tmdbId: guess.id },
				create: movie,
				update: movie,
			});
			await db.screener.update({
				where: screener,
				data: {
					tmdbId: movie.tmdbId,
					searchCount: 0,
					searchedAt: null,
				},
			});
		} else {
			await db.screener.update({
				where: screener,
				data: {
					searchCount: { increment: 1 },
					searchedAt: now.toJSDate(),
				},
			});
		}

		const search = await db.screener.findUnique({
			where: { id: screener.id },
			select: {
				screenings: {
					take: 1,
					select: {
						event: {
							select: {
								production: {
									select: {
										url: true,
									},
								},
							},
						},
					},
				},
				movie: {
					select: {
						title: true,
						tagline: true,
						tmdbId: true,
					},
				},
			},
		});
		return {
			...search,
			url: search?.movie ? `https://www.themoviedb.org/movie/${search.movie.tmdbId}` : undefined,
		};
	}
};

if (require.main === module) {
	guessMovies()
		.then((data) => JSON.stringify(data, null, "\t"))
		.then(console.log)
		.catch(console.error)
		.finally(() => process.exit(0));
}
