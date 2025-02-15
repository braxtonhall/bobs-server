import Config from "../../Config.js";
import got from "got";

export const tmdb = got.extend({
	prefixUrl: "https://api.themoviedb.org/3",
	searchParams: {
		api_key: Config.TMDB_API_KEY,
	},
	headers: {
		accept: "application/json",
	},
});
