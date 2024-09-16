import { City } from "../City";
import { DateTime } from "luxon";
import batchImport from "../../util/batchImport";
import path from "path";

export interface Theatre {
	readonly url: string;
	readonly name: string;
	readonly logoUrl: string;
	readonly city: City;
	readonly scrape: () => Promise<ScrapedProduction[]>;
}

export interface ScrapedScreener {
	name: string;
	year: number | null;
	director: string | null;
	runtime: number;
	language: string | null;
}

export interface ScrapedScreening {
	subtitles: string[];
	format: string | null;
	screener: ScrapedScreener;
}

export interface ScrapedEvent {
	url: string | null;
	time: DateTime;
	screenings: ScrapedScreening[];
	metadata: Record<string, string>;
}

export interface ScrapedProduction {
	url: string | null;
	name: string;
	events: ScrapedEvent[];
}

const isTheatre = <T>(unknown: T): unknown is Theatre & T =>
	!!unknown &&
	typeof unknown === "object" &&
	"url" in unknown &&
	typeof unknown.url === "string" &&
	"name" in unknown &&
	typeof unknown.name === "string" &&
	"logoUrl" in unknown &&
	typeof unknown.logoUrl === "string" &&
	"city" in unknown &&
	typeof unknown.city === "string" &&
	"scrape" in unknown &&
	typeof unknown.scrape === "function";

let theatres: Theatre[] | null = null;

export const getTheatres = async (): Promise<Theatre[]> => {
	if (theatres === null) {
		const maybeTheatres = await batchImport(path.join(__dirname, "impl"));
		theatres = Array.from(maybeTheatres)
			.map((result) => result.default)
			.filter(isTheatre);
	}
	return theatres;
};
