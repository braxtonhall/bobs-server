import type { ScrapedEvent, ScrapedProduction, ScrapedScreening, Theatre } from "../Theatre";
import { City } from "../../City";
import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { DateTime } from "luxon";

const DATE_FORMAT = "yyyy-MM-dd HH:mm";
const MONTHS_TO_QUERY = 1;
const LIMIT = 1000;
const METADATA_REGEX = /\(([^)]*)([0-9]{4}),\s+([0-9]+)['’]\)/;
const EXTRA_PARENS_REGEX = /\s*(\([^)]*\)\s*)?$/;

type EyeCompositionEntry = { mainTitle: string };

type EyeProduction = {
	compositionProgram: EyeCompositionEntry[];
	director: string | null;
	originalTitle: string;
	url: string;
	length: number;
	year: string;
};

type EyeShow = {
	url: string;
	startDateTime: string;
	singleSubtitles: string;
	carrier: [{ carrier: string }]; // DCP, 16mm, 35mm...
	production: [EyeProduction];
};

type EyeResponse = {
	shows: EyeShow[];
};

/**
 * Code shamelessly stolen from
 * https://github.com/ckuijjer/expatcinema.com/blob/6f2a4e9d3bbd2702dc23d75b2de1ab67502407cd/cloud/scrapers/eyefilm.ts
 */
const getShowings = async (): Promise<EyeResponse> => {
	const client = new ApolloClient({
		link: new HttpLink({ uri: "https://www.eyefilm.nl/graphql", fetch }),
		cache: new InMemoryCache(),
	});
	const now = DateTime.now();
	const cutoff = now.plus({ months: MONTHS_TO_QUERY });
	const results = await client.query({
		variables: {
			siteId: "eyeEnglish",
			startDateTime: ["and", `> ${now.toFormat(DATE_FORMAT)}`, `< ${cutoff.toFormat(DATE_FORMAT)}`],
			limit: LIMIT,
		},
		query: gql`
			query shows(
				$siteId: [String]
				$search: String = null
				$productionType: Int = null
				$startDateTime: [QueryArgument]
				$label: [String] = null
				$productionThemeId: Int = null
				$language: String = null
				$limit: Int = 40
			) {
				shows(
					site: $siteId
					productionThemeId: $productionThemeId
					productionType: $productionType
					search: $search
					startDateTime: $startDateTime
					label: $label
					language: $language
					limit: $limit
				) {
					... on show_show_Entry {
						url
						startDateTime
						# endDateTime
						singleSubtitles
						carrier {
							carrier # film format
						}
						production {
							compositionProgram {
								mainTitle
							}
							# productionCountries
							# spokenLanguage
							# primaryLanguage
							# subtitles { # flag if one of these don't appear in any 'singleSubtitles'
							# 	subtitle
							# }
							director
							originalTitle
							url
							length
							year
						}
					}
				}
			}
		`,
	});
	return results.data;
};

const groupBy = <K extends PropertyKey, T>(
	items: Iterable<T>,
	keySelector: (item: T, index: number) => K,
): Partial<Record<K, T[]>> => {
	const out: Partial<Record<K, T[]>> = {};
	let i = 0;
	for (const item of items) {
		const key = keySelector(item, i++);
		out[key] ??= [];
		out[key]!.push(item);
	}
	return out;
};

const selectSubtitles = (subtitleCode: string): string[] => {
	switch (subtitleCode) {
		case "42c27a5b-2d4e-4195-b547-cb6fbe9fcd49":
			return ["en"];
		case "41ad8fc8-2c17-46fd-9094-fb3d4a2884fa":
			return ["nl"];
		case "ad0f14c5-9023-416b-995a-1fad23ecb96c":
			return ["fr"];
		case "6e5a13f9-22d0-401c-a5e9-7d3b14578eaf":
			return [];
		default:
			console.warn("Unrecognized language code", subtitleCode);
			return [];
	}
};

const codeToFormat = (formatCode: string): string | null => {
	switch (formatCode) {
		case "b9bf2863-cc96-4001-ba5d-c1040a2bcd9d":
			return "16mm";
		case "89eae84d-e560-41ab-8dc8-4cfae6f8c35b":
			return "35mm";
		case "342d5a1e-f6e0-44a5-ad1d-df78d4b67ead":
			return "70mm";
		case "8f34ffe1-bc79-4250-b1a9-6e1b5c416735":
			return "dcp";
		default:
			console.warn("Unrecognized format code", formatCode);
			return null;
	}
};

const guessFormat = ({ mainTitle, screenerTitle }: { mainTitle: string; screenerTitle: string }): string | null =>
	["35mm", "16mm", "70mm"].find((format) => mainTitle.includes(format) && !screenerTitle.includes(format)) ?? null;

const showToScreenings = (show: EyeShow): ScrapedScreening[] => [
	{
		subtitles: selectSubtitles(show.singleSubtitles),
		format: codeToFormat(show.carrier[0].carrier),
		screener: {
			name: show.production[0].originalTitle,
			year: Number(show.production[0].year) || null,
			runtime: show.production[0].length,
			director: show.production[0].director,
			language: null, // TODO get the language!!!
		},
	},
];

const showToEvent = (show: EyeShow): ScrapedEvent => {
	const production = show.production[0];
	const compositeScreenings = production.compositionProgram
		.map(compositeEntryToScreening(show))
		.filter((screening) => !!screening);
	const screenings = compositeScreenings.length ? compositeScreenings : showToScreenings(show);
	return {
		time: DateTime.fromISO(show.startDateTime),
		url: show.url,
		screenings,
		metadata: {}, // TODO get more metadata like the screening room!
	};
};

const showsToProduction = (shows: EyeShow[]): ScrapedProduction => ({
	name: shows[0].production[0].originalTitle,
	url: shows[0].production[0].url,
	events: shows.map(showToEvent),
});

const compositeEntryToScreening =
	(show: EyeShow) =>
	({ mainTitle }: EyeCompositionEntry): ScrapedScreening | null => {
		const metadataMatch = mainTitle.match(METADATA_REGEX);
		if (metadataMatch) {
			const title = mainTitle.replace(METADATA_REGEX, "").replace(EXTRA_PARENS_REGEX, "");
			const year = Number(metadataMatch[2]);
			const runtime = Number(metadataMatch[3]);
			const remainder = metadataMatch[1];
			const director = remainder.replace(/,\s+([A-Z]{2}\s+)?$/, "");
			return {
				subtitles: selectSubtitles(show.singleSubtitles),
				format: guessFormat({ mainTitle, screenerTitle: title }),
				screener: {
					director,
					name: title,
					year,
					runtime,
					language: null, // TODO what language is it???
				},
			};
		} else {
			return null;
		}
	};

const groupResults = (response: EyeResponse): ScrapedProduction[] =>
	Object.values(groupBy(response.shows, (show: EyeShow): string => new URL(show.url).pathname))
		.filter((shows) => !!shows)
		.map(showsToProduction);

export default {
	url: "https://www.eyefilm.nl/",
	name: "Eye Filmmuseum",
	logoUrl: "https://www.eyefilm.nl/images/loader-eye.gif",
	city: City.AMSTERDAM,
	scrape: async (): Promise<ScrapedProduction[]> => {
		const showings = await getShowings();
		return groupResults(showings);
	},
} satisfies Theatre;
