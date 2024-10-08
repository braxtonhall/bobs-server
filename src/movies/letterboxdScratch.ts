import { DateTime } from "luxon";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import xray from "./util/x-ray";
import Config from "../Config";
import { List } from "@prisma/client";
import { db } from "../db";

const watchedMovieSchema = z
	.object({
		pubDate: z
			.string()
			.transform((date) => DateTime.fromRFC2822(date))
			.transform((date, ctx) => {
				if (date.isValid) {
					return date;
				} else {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Date format is incorrect",
					});
					return z.NEVER;
				}
			}),
		link: z.string(),
		"tmdb:movieId": z.number(),
	})
	.passthrough();

const rssResponseSchema = z.object({
	rss: z.object({
		channel: z.object({
			item: z.array(z.unknown()).transform((items) =>
				items
					.map((item) => watchedMovieSchema.safeParse(item))
					.filter((item) => item.success)
					.map((item) => item.data),
			),
		}),
	}),
});

const getWatchedMovies = async (userName: string, since: DateTime): Promise<{ slug: string; tmdbId: number }[]> => {
	try {
		const response = await fetch(`https://letterboxd.com/${userName}/rss`);
		const xml = await response.text();
		const result = rssResponseSchema.parse(new XMLParser().parse(xml));
		const moviesSince = result.rss.channel.item.filter((movie) => movie.pubDate > since);
		return moviesSince.map((movie) => {
			const slug = new URL(movie.link).pathname.split("/")[3] ?? "";
			return {
				slug,
				tmdbId: movie["tmdb:movieId"],
			};
		});
	} catch {
		return [];
	}
};

type ScrapeResult = {
	metadata: { count: number | null; watchlist: boolean; owner?: string; name?: string };
	movies: { slug: string; index?: number }[];
};

const scrapeList = async (list: string): Promise<ScrapeResult> =>
	xray(list, {
		metadata: {
			count: ".js-watchlist-count | parseInt",
			name: "h1.title-1",
			owner: "body@data-owner",
			watchlist: "body.watchlist | exists",
		},
		movies: xray("li.poster-container", [
			{
				slug: "> div.film-poster@data-film-slug",
				index: "> p.list-number | parseInt",
			},
		])
			.paginate(".next@href")
			.limit(Config.LETTERBOXD_LIST_PAGE_LIMIT),
	});

const getList = async (list: string): Promise<ScrapeResult> => {
	// TODO get the first page. assess how many pages there are. get the remaining pages
	//  if the number of films found matches the expected number of films, exit
	//  else do a second search just in case :)
	const { metadata, movies } = await scrapeList(list);
	// TODO if movies.length === LIMIT * 28, return
	// TODO if movies.length !== metadata.count, rerun
	// TODO if movies.some movie => movie.index !== index + 1, rerun
	return { metadata, movies };
};

const updateList = async (link: string) => {
	const now = DateTime.now();
	const list = await db.list.upsert({
		where: { link },
		update: {},
		create: {
			link,
			updatedAt: now.minus({ day: Config.LETTERBOXD_LIST_UPDATE_INTERVAL_DAYS }).toJSDate(),
			name: "loading...",
		},
	});

	// if (list.watchlist && list.owner) {
	// 	const watched = await getWatchedMovies(list.owner, DateTime.fromJSDate(list.updatedAt));
	// 	// TODO for each of these, we can freely attach a tmdbId
	// 	await db.listEntry.deleteMany({
	// 		where: { listLink: link, movieSlug: { in: watched.map(({ slug }) => slug) } },
	// 	});
	// }

	const details = await getList(link);

	await db.list.update({
		where: {
			link,
		},
		data: {
			watchlist: details.metadata.watchlist,
		},
	});
};

const run = async () => scrapeList("https://letterboxd.com/journal/");

if (require.main === module) {
	run()
		.then(console.log)
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
