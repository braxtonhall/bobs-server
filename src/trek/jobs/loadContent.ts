import { parse } from "csv-parse";
import { db } from "../../db.js";
import { loadResource } from "../../util/loadResource.js";
import { Job } from "../../jobs.js";
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
		const seasonNumber = Number(row.SEASON) || 0;
		const production = Number(row.EPISODE) || 0;

		const episode = {
			seriesId,
			season: seasonNumber,
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

		const season = { seriesId, number: seasonNumber };
		await db.trekSeason.upsert({
			where: {
				seriesId_number: season,
			},
			update: season,
			create: season,
		});

		await db.episode.upsert({
			where: {
				seriesId_season_production: {
					seriesId,
					season: seasonNumber,
					production,
				},
			},
			update: episode,
			create: episode,
		});
	}
};

const ensureDefaultWatchlist = async () => {
	const watchlist = await db.watchlist.findFirst({
		where: {
			ownerId: { in: null },
		},
	});
	if (watchlist) {
		return watchlist.id;
	} else {
		const watchlist = await db.watchlist.create({
			data: {
				name: "a name",
				description: "a description",
			},
		});
		return watchlist.id;
	}
};

const setDefaultWatchlist = async () => {
	const id = await ensureDefaultWatchlist();
	const episodes = await db.episode.findMany({
		select: {
			id: true,
		},
		orderBy: {
			sort: "asc",
		},
	});

	return db.watchlist.update({
		where: {
			id,
		},
		data: {
			name: "bob's trek",
			description: "Where some have gone before",
			tags: {},
			entries: {
				deleteMany: {},
				create: episodes.map(({ id }, rank) => ({
					episodeId: id,
					rank,
				})),
			} as const,
		},
	});
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
