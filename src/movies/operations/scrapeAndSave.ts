import {
	getTheatres,
	ScrapedEvent,
	ScrapedProduction,
	ScrapedScreening,
	Theatre as InternalTheatre,
} from "../theatres/Theatre";
import AsyncPool from "../../util/AsyncPool";
import fs from "fs/promises";
import path from "path";
import { db } from "../../db";
import { Event, Production, Theatre } from "@prisma/client";
import { DateTime } from "luxon";

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
				name_year_runtime: {
					name: screening.screener.name,
					year: screening.screener.year ?? -1,
					runtime: screening.screener.runtime ?? -1,
				},
			},
			update: {},
			create: {
				name: screening.screener.name,
				year: screening.screener.year ?? -1,
				runtime: screening.screener.runtime ?? -1,
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
				},
				create: {
					time,
					productionId: production.id,
					url: event.url,
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

export const scrapeAndSave = async () => {
	const before = DateTime.now();
	const theatres = await getTheatres();
	await AsyncPool.map(theatres, scrapeAndSaveTheatre, 2);

	const took = before.diffNow();

	console.log(
		{
			englishSubs: await db.production.findMany({
				where: {
					events: {
						some: {
							screenings: {
								some: {
									OR: [
										{
											subtitles: {
												some: {
													id: "en",
												},
											},
										},
									],
								},
							},
						},
					},
				},
				select: {
					name: true,
					url: true,
				},
			}),
			productions: await db.production.count(),
			events: await db.event.count(),
			screenings: await db.screening.count(),
			screeners: await db.screener.count(),
			movie: await db.movie.count(),
		},
		took.as("milliseconds"),
	);
};

if (require.main === module) {
	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
	scrapeAndSave()
		.then((results) => JSON.stringify(results, null, "\t"))
		.then(console.log)
		// .then((json) => fs.writeFile(path.join(__dirname, "screenings.json"), json))
		.catch(console.error)
		.finally(() => process.exit(0));
}
