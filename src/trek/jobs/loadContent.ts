import { parse } from "csv-parse";
import { db } from "../../db";
import { loadResource } from "../../util/loadResource";
import { Job } from "../../jobs";
import { DateTime } from "luxon";

type Show = { ID: string; NAME: string };

type Episode = {
	SERIES_ID: string;
	ABBR: string;
	SEASON: string;
	EPISODE: string;
	NAME: string;
	STAR_DATE: string;
	YEAR: string;
	MONTH: string;
	DAY: string;
};

const loadCsv = async <T>(csv: string): Promise<T[]> => {
	const resource = await loadResource("trek", csv);
	return parse(resource, { columns: true }).toArray();
};

const loadShows = async () => {
	const shows = await loadCsv<Show>("shows.csv");
	for (const { ID: id, NAME: name } of shows) {
		const show = { id, name };
		await db.series.upsert({
			where: {
				id,
			},
			create: show,
			update: show,
		});
	}
};

const loadEpisodes = async () => {
	const episodes = await loadCsv<Episode>("episodes.csv");
	for (let i = 0; i < episodes.length; i++) {
		const row = episodes[i];
		const seriesId = row.SERIES_ID;
		const season = Number(row.SEASON) || 0;
		const production = Number(row.EPISODE) || 0;

		const episode = {
			seriesId,
			season,
			production,
			abbreviation: row.ABBR || null,
			name: row.NAME,
			runtime: 0, // TODO
			description: "", // TODO
			starDate: Number(row.STAR_DATE) || null,
			sort: i,
			release: DateTime.fromObject({
				year: Number(row.YEAR),
				month: Number(row.MONTH),
				day: Number(row.DAY),
			}).toFormat("yyyy-MM-dd"),
		};

		await db.episode.upsert({
			where: {
				seriesId_season_production: {
					seriesId,
					season,
					production,
				},
			},
			update: episode,
			create: episode,
		});
	}
};

const setDefaultWatchlist = async () => {
	const watchlist = await db.watchlist.findFirst({
		where: {
			ownerId: { in: null },
		},
	});
	const data = {
		name: "bob's trek",
		description: "Where some have gone before",
		filters: "{}",
		episodes: {
			connect: await db.episode.findMany({
				select: {
					id: true,
				},
				orderBy: {
					sort: "asc",
				},
			}),
		},
	} as const;
	if (watchlist) {
		await db.watchlist.update({
			where: {
				id: watchlist.id,
			},
			data,
		});
	} else {
		await db.watchlist.create({ data });
	}
};

const load = async () => {
	await loadShows();
	await loadEpisodes();
	await setDefaultWatchlist();
};

export const loadContent = {
	callback: load,
	interval: Infinity,
} satisfies Job;

if (require.main === module) {
	load()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
