import { DateTime } from "luxon";
import { XMLParser } from "fast-xml-parser";

const getWatchedMovies = async (userName: string, since: DateTime) => {
	// TODO https://letterboxd.com/${userName}/rss
	//  resolves with a list of the movies that the user has seen since `since`
	const response = await fetch(`https://letterboxd.com/${userName}/rss`);
	const xml = await response.text();
	const result = new XMLParser().parse(xml);
	/** movie example
	 *   {
	 *     title: 'The River, 1997',
	 *     link: 'https://letterboxd.com/braxtonhall/film/the-river-1997/',
	 *     guid: 'letterboxd-watch-681205961',
	 *     pubDate: 'Mon, 30 Sep 2024 05:28:57 +1300',
	 *     'letterboxd:watchedDate': '2024-09-29',
	 *     'letterboxd:rewatch': 'No',
	 *     'letterboxd:filmTitle': 'The River',
	 *     'letterboxd:filmYear': 1997,
	 *     'tmdb:movieId': 54291,
	 *     description: ' <p><img src="https://a.ltrbxd.com/resized/film-poster/1/1/7/8/2/11782-the-river-0-600-0-900-crop.jpg?v=992341c945"/></p> <p>Watched on Sunday September 29, 2024.</p> ',
	 *     'dc:creator': 'bob&#039;s son [sic]'
	 *   },
	 */

	/** list example
	 *   {
	 *     title: 2021,
	 *     link: 'https://letterboxd.com/braxtonhall/list/2021/',
	 *     guid: 'letterboxd-list-31448919',
	 *     pubDate: 'Tue, 11 Apr 2023 01:46:43 +1200',
	 *     description: ' <p>no particular order</p> <ul> <li> <a href="https://letterboxd.com/film/nomadland/">Nomadland</a> </li> <li> <a href="https://letterboxd.com/film/alien/">Alien</a> </li> <li> <a href="https://letterboxd.com/film/dazed-and-confused/">Dazed and Confused</a> </li> <li> <a href="https://letterboxd.com/film/la-haine/">La Haine</a> </li> <li> <a href="https://letterboxd.com/film/seven-samurai/">Seven Samurai</a> </li> <li> <a href="https://letterboxd.com/film/dr-strangelove-or-how-i-learned-to-stop-worrying-and-love-the-bomb/">Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb</a> </li> </ul> ',
	 *     'dc:creator': 'bob&#039;s son [sic]'
	 *   }
	 */

	return result.rss.channel.item;
};

const getPage = async (list: string, page: number) => {
	// TODO resolves with a list of movies, as well as some metadata like number of pages/films total
};

const getList = async (list: string) => {
	// TODO get the first page. assess how many pages there are. get the remaining pages
	//  if the number of films found matches the expected number of films, exit
	//  else do a second search just in case :)
};

const run = async () => {
	return getWatchedMovies("braxtonhall", DateTime.now());
};

if (require.main === module) {
	run()
		.then(console.log)
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
