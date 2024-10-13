import Config from "../../Config";

const futureKy = eval('import("ky")') as Promise<typeof import("ky")>;

const YEAR_DELTA = 2;

const futureClient = futureKy.then((ky) =>
	ky.default.extend({
		prefixUrl: "https://api.themoviedb.org/3",
		searchParams: {
			api_key: Config.TMDB_API_KEY,
		},
		headers: {
			accept: "application/json",
		},
	}),
);

type MovieSearchResult = {
	adult: boolean;
	backdrop_path: string | null;
	genre_ids: number[];
	id: number;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string;
	release_date: string;
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
};

type Movie = {
	adult: boolean;
	backdrop_path: string | null;
	belongs_to_collection: {
		id: number;
		name: string;
		poster_path: string;
		backdrop_path: string;
	} | null;
	budget: number;
	genres: Array<{ id: number; name: string }>;
	homepage: string;
	id: number;
	imdb_id: string | null;
	origin_country: string[];
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string | null;
	production_companies: Array<{
		id: number;
		logo_path: string | null;
		name: string;
		origin_country: string;
	}>;
	production_countries: Array<{ iso_3166_1: string; name: string }>;
	release_date: string;
	revenue: number;
	runtime: number;
	spoken_languages: Array<{ english_name: string; iso_639_1: string; name: string }>;
	status: string;
	tagline: string | null;
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
};

const searchMovie = async (name: string, year?: number): Promise<MovieSearchResult[]> => {
	const client = await futureClient;
	const response = await client
		.get("search/movie", {
			searchParams: {
				include_adult: false,
				page: 1,
				query: name,
				...(year ? { year } : {}),
			},
		})
		.json();
	return (response as any).results;
};

const getMovie = async (id: number): Promise<Movie> => {
	const client = await futureClient;
	const result = await client.get(`movie/${id}`).json();
	return result as any;
};

export const guessMovie = async (name: string, year?: number): Promise<Movie | null> => {
	// TODO should also be using the runtime and director if possible.. and maybe country?
	let results = await searchMovie(name, year);
	if (results.length === 0 && year) {
		results = await searchMovie(name);
		results = results.filter((movie) => {
			const releaseYear = new Date(movie.release_date).getFullYear();
			return releaseYear <= year + YEAR_DELTA && releaseYear >= year - YEAR_DELTA;
		});
	}

	if (results.length === 0) {
		return null;
	}

	return getMovie(results[0].id);
	// const filmName = name.toLowerCase();
	// const resultName = results[0]?.original_title?.toLowerCase();
	// if (filmName === resultName) {
	// 	return await getMovie(results[0].id);
	// } else {
	// 	// TODO here you can check for other names
	// 	// TODO here you can use string-similarity-js
	// 	//      to see if the strings are at least close
	// 	return null;
	// }
};
