import { DateTime } from "luxon";
import xray from "./util/x-ray";
import Config from "../Config";
import { db, transaction } from "../db";

type ListScrapeResult = {
	metadata: { count: number | null; watchlist: boolean; owner?: string; name?: string };
	movies: { slug: string; index?: number }[];
};

const scrapeList = async (list: string): Promise<ListScrapeResult> =>
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

export const getTmdbId = async (slug: string): Promise<number | null> => {
	try {
		return await xray(`https://letterboxd.com/film/${slug}/`, "body.film@data-tmdb-id | parseInt");
	} catch {
		return null;
	}
};

const getList = async (list: string): Promise<ListScrapeResult> => {
	// TODO get the first page. assess how many pages there are. get the remaining pages
	//  if the number of films found matches the expected number of films, exit
	//  else do a second search just in case :)
	const { metadata, movies } = await scrapeList(list);
	// TODO if movies.length === LIMIT * 28, return
	// TODO if movies.length !== metadata.count, rerun
	// TODO if movies.some movie => movie.index !== index + 1, rerun
	return { metadata, movies };
};

const selectName = (metadata: ListScrapeResult["metadata"]): string => {
	if (metadata.watchlist) {
		const name = metadata.owner ?? "someone";
		return `${name}'s watchlist`;
	} else {
		return metadata.name ?? "a list";
	}
};

export const putList = async (link: string) =>
	// TODO this code goes into putList
	updateList(
		await db.list.upsert({
			where: { link },
			update: {},
			create: {
				link,
				updatedAt: DateTime.now().minus({ day: Config.LETTERBOXD_LIST_UPDATE_DELAY_DAYS }).toJSDate(),
				name: "loading...",
			},
			select: { link: true },
		}),
	);

export const updateList = async (list: { link: string }) => {
	// TODO most of this code goes into updateLists.
	const now = DateTime.now();
	const details = await getList(list.link);
	// TODO if the details says it's not a list, maybe just delete it?
	return transaction(async () => {
		await db.listEntry.deleteMany({
			where: { list },
		});

		await Promise.all(
			details.movies.map(({ slug, index }) =>
				db.listEntry.create({
					data: {
						movie: {
							connectOrCreate: {
								where: { slug },
								create: { slug },
							},
						},
						list: { connect: list },
						index,
					},
				}),
			),
		);

		await db.list.update({
			where: list,
			data: {
				name: selectName(details.metadata),
				updatedAt: now.toJSDate(),
			},
		});
	});
};

if (require.main === module) {
	getTmdbId("fpppppp")
		.then(console.log)
		.then(() => process.exit(0))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}
