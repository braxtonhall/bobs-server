import { DateTime } from "luxon";

const getWatchedMovies = async (userName: string, since: DateTime) => {
	// TODO https://letterboxd.com/${userName}/rss
	// resolves with a list of the movies that the user has seen since `since`
};

const getPage = async (list: string, page: number) => {
	// TODO resolves with a list of movies, as well as some metadata like number of pages total
};

const getList = async (list: string) => {
	// TODO get the first page. assess how many pages there are. get the remaining pages
};

const run = async () => {};

if (require.main === module) {
	run()
		.then(console.log)
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
