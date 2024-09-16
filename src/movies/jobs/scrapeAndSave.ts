import {
	getTheatres,
	ScrapedEvent,
	ScrapedProduction,
	ScrapedScreening,
	Theatre as InternalTheatre,
} from "../theatres/Theatre";
import AsyncPool from "../../util/AsyncPool";
import { db, transaction } from "../../db";
import { Event, Production, Theatre } from "@prisma/client";
import { Duration } from "luxon";
import { Job } from "../../jobs";

const saveScreenings = async (event: Event, screenings: ScrapedScreening[]) => {
	for (const screening of screenings) {
		const subtitles = {
			connectOrCreate: screening.subtitles.map((code) => ({
				where: {
					id: code,
				},
				create: {
					id: code,
				},
			})),
		};
		const screener = await db.screener.upsert({
			where: {
				name_year_runtime_director_language: {
					name: screening.screener.name,
					year: screening.screener.year ?? -1,
					runtime: screening.screener.runtime ?? -1,
					director: screening.screener.director ?? "",
					language: screening.screener.language ?? "",
				},
			},
			update: {},
			create: {
				name: screening.screener.name,
				year: screening.screener.year ?? -1,
				runtime: screening.screener.runtime ?? -1,
				director: screening.screener.director ?? "",
				language: screening.screener.language ?? "",
			},
			select: {
				id: true,
			},
		});
		await db.screening.upsert({
			where: {
				eventId_screenerId: {
					eventId: event.id,
					screenerId: screener.id,
				},
			},
			update: {
				format: screening.format,
				subtitles,
			},
			create: {
				format: screening.format,
				eventId: event.id,
				screenerId: screener.id,
				subtitles,
			},
		});
	}
};

const saveEvents = async (production: Production, events: ScrapedEvent[]) => {
	for (const event of events) {
		const time = event.time.toJSDate();
		const metadata = JSON.stringify(event.metadata);
		await saveScreenings(
			await db.event.upsert({
				where: {
					productionId_time: {
						time,
						productionId: production.id,
					},
				},
				update: {
					url: event.url,
					metadata,
				},
				create: {
					time,
					productionId: production.id,
					url: event.url,
					metadata,
				},
			}),
			event.screenings,
		);
	}
};

const saveProductions = async (theatre: Theatre, productions: ScrapedProduction[]) => {
	for (const production of productions) {
		await saveEvents(
			await db.production.upsert({
				where: {
					theatreId_name_url: {
						name: production.name,
						url: production.url ?? "",
						theatreId: theatre.id,
					},
				},
				update: {},
				create: {
					name: production.name,
					url: production.url ?? "",
					theatreId: theatre.id,
				},
			}),
			production.events,
		);
	}
};

const scrapeAndSaveTheatre = async (theatre: InternalTheatre) => {
	const productions = await theatre.scrape();
	await saveProductions(
		await db.theatre.upsert({
			where: {
				url: theatre.url,
			},
			update: {
				name: theatre.name,
				logoUrl: theatre.logoUrl,
				city: {
					connectOrCreate: {
						where: {
							name: theatre.city,
						},
						create: {
							name: theatre.city,
						},
					},
				},
			},
			create: {
				name: theatre.name,
				logoUrl: theatre.logoUrl,
				url: theatre.url,
				city: {
					connectOrCreate: {
						where: {
							name: theatre.city,
						},
						create: {
							name: theatre.city,
						},
					},
				},
			},
		}),
		productions,
	);
};

export const scrapeAndSave = {
	interval: Duration.fromObject({ days: 1 }).toMillis(),
	callback: async () => {
		const theatres = await getTheatres();
		await AsyncPool.map(theatres, (theatre) => transaction(scrapeAndSaveTheatre, theatre), 2);
	},
} satisfies Job;
