import type { ScrapedEvent, ScrapedScreener, ScrapedProduction, Theatre } from "../Theatre";
import { City } from "../../City";
import xray from "../../util/x-ray";
import AsyncPool from "../../../util/AsyncPool";
import { DateTime } from "luxon";

type HomepageEntry = {
	url: string;
	title: string;
};

type UitkijkScreening = {
	date: string;
	url: string;
};

type UitkijkMetadata = `${string}:${string}`[];

type UitkijkProduction = {
	url: string;
	title: string;
	metadata: UitkijkMetadata;
	screenings: UitkijkScreening[];
};

const getEntries = async (): Promise<HomepageEntry[]> =>
	await xray("https://uitkijk.nl/en", ".movie-grid li", [
		{
			url: "> a@href",
			title: "span | trim",
		},
	]);

const getEntryData = async (entry: HomepageEntry): Promise<UitkijkProduction> => {
	return {
		...entry,
		...(await xray(entry.url, {
			metadata: [".film-details li | normalizeWhitespace | trim"],
			screenings: xray(".film-tickets li a", [
				{
					date: "@data-date",
					url: "@href",
				},
			]),
		})),
	};
};

const createMetadataRecord = (metadata: UitkijkMetadata): Record<string, string> => {
	const entries = metadata
		.map((entry) => entry.match(/(^[^:]*):(.*)/))
		.filter((match) => !!match)
		.map((match) => [match[1], match[2]]);
	return Object.fromEntries(entries);
};

const selectTime = (date: string): DateTime => DateTime.fromFormat(date, "dd-MM-yy-HH:mm");

const selectYear = (metadata: Record<string, string>): number | null => Number(metadata.Year) || null;

const selectSubtitles = (metadata: Record<string, string>): string[] => {
	const subtitlesString = metadata.Subtitles;
	switch (subtitlesString) {
		case "English":
			return ["en"];
		case "Dutch":
			return ["nl"];
		case undefined:
			return [];
		default:
			console.warn("Unrecognized language code", subtitlesString);
			return [];
	}
};

const selectRuntime = (metadata: Record<string, string>): number => {
	const duration = parseInt(metadata.Duration);
	if (isNaN(duration)) {
		throw new Error("No runtime");
	} else {
		return duration;
	}
};

const screeningToEvent =
	(movie: ScrapedScreener, metadata: Record<string, string>) =>
	(screening: UitkijkScreening): ScrapedEvent => ({
		url: screening.url,
		time: selectTime(screening.date),
		screenings: [
			{
				subtitles: selectSubtitles(metadata),
				format: null,
				screener: movie,
			},
		],
	});

const movieToProduction = (movie: UitkijkProduction): ScrapedProduction | null => {
	const metadata = createMetadataRecord(movie.metadata);
	try {
		return {
			url: movie.url,
			name: movie.title,
			events: movie.screenings.map(
				screeningToEvent(
					{
						name: movie.title,
						year: selectYear(metadata),
						runtime: selectRuntime(metadata),
						director: metadata.Director ?? null,
					},
					metadata,
				),
			),
		};
	} catch {
		return null;
	}
};

export default {
	url: "https://uitkijk.nl/",
	name: "Filmtheater De Uitkijk",
	logoUrl: "https://uitkijk.nl/android-chrome-192x192.png",
	city: City.AMSTERDAM,
	scrape: async (): Promise<ScrapedProduction[]> => {
		const entries = await getEntries();
		const movies = await AsyncPool.map(entries, getEntryData, 3);
		return movies.map(movieToProduction).filter((production) => !!production);
	},
} satisfies Theatre;
