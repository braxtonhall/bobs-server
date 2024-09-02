import type { ScrapedEvent, ScrapedProduction, Theatre } from "../Theatre";
import { City } from "../../City";
import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { DateTime } from "luxon";

const DATE_FORMAT = "yyyy-MM-dd HH:mm";
const MONTHS_TO_QUERY = 1;
const LIMIT = 1000;

type EyeShow = {
	url: string;
	startDateTime: string;
	endDateTime: string;
	singleSubtitles: string;
	carrier: [
		{
			carrier: string; // DCP, 16mm, 35mm...
		},
	];
	production: [
		{
			year: string;
			length: number;
			url: string;
			primaryLanguage: string;
			director: string;
			originalTitle: string;
		},
	];
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
						endDateTime
						singleSubtitles
						carrier {
							carrier
						}
						production {
							primaryLanguage
							director
							originalTitle
							url
							length
							year${"" /*TODO could also use... original title,*/}
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
		case "6e5a13f9-22d0-401c-a5e9-7d3b14578eaf":
			return [];
		default:
			console.warn("Unrecognized language code", subtitleCode);
			return [];
	}
};

const selectFormat = (formatCode: string): string | null => {
	switch (formatCode) {
		case "89eae84d-e560-41ab-8dc8-4cfae6f8c35b":
			return "35mm";
		case "8f34ffe1-bc79-4250-b1a9-6e1b5c416735":
			return "dcp";
		default:
			console.warn("Unrecognized format code", formatCode);
			return null;
	}
};

const groupResults = (response: EyeResponse): ScrapedProduction[] => {
	const groups = groupBy(response.shows, (show: EyeShow): string => new URL(show.url).pathname);
	return Object.values(groups)
		.filter((shows) => !!shows)
		.map((shows): ScrapedProduction => {
			const [first] = shows;
			return {
				name: first.production[0].originalTitle,
				url: first.production[0].url,
				events: shows.map(
					(show: EyeShow): ScrapedEvent => ({
						time: DateTime.fromISO(show.startDateTime),
						url: show.url,
						// TODO support multiple movies in a single screening
						//  https://www.eyefilm.nl/en/whats-on/filmmagie-kijken-en-maken/878297?show=1325418
						screenings: [
							{
								subtitles: selectSubtitles(show.singleSubtitles),
								format: selectFormat(show.carrier[0].carrier),
								screener: {
									name: show.production[0].originalTitle,
									year: Number(show.production[0].year) || null,
									runtime: show.production[0].length,
								},
							},
						],
					}),
				),
			};
		});
};

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
