import fs from "fs/promises";
import path from "node:path";
import { Job } from "../../jobs.js";
import { registerFont } from "canvas";
import { z } from "zod";

// fonts come from https://fontsource.org/
export const fonts = [
	{ family: "Inter", slug: "inter" },
	{ family: "EB Garamond", slug: "eb-garamond" },
	{ family: "Courier Prime", slug: "courier-prime" },
	{ family: "Montserrat", slug: "montserrat" },
	{ family: "Roboto", slug: "roboto" },
	{ family: "Merriweather", slug: "merriweather" },
	{ family: "Parisienne", slug: "parisienne" },
	{ family: "Raleway", slug: "raleway" },
	{ family: "Cedarville Cursive", slug: "cedarville-cursive" },
	{ family: "Anton", slug: "anton" },
	{ family: "DSEG7 Classic", slug: "dseg7-classic" },
	{ family: "Poiret One", slug: "poiret-one" },
] as const satisfies { family: string; slug: string }[];

type Families<A extends { family: unknown }[]> = A extends []
	? []
	: A extends [infer First extends { family: unknown }, ...infer Rest extends { family: unknown }[]]
		? [First["family"], ...Families<Rest>]
		: never;

export const fontFamilies = fonts.map(({ family }) => family) as Families<typeof fonts>;

export const fontManifestSchema = z.array(
	z.object({
		family: z.string(),
		weight: z.string(),
		style: z.string(),
		path: z.string(),
	}),
);

export const loadFonts = {
	callback: async () => {
		const contents = await fs.readFile("fonts/manifest.json", "utf-8");
		const manifest = fontManifestSchema.parse(JSON.parse(contents));
		for (const { family, weight, style, ...entry } of manifest) {
			registerFont(path.resolve(entry.path), { family, weight, style });
		}
	},
	interval: Infinity,
} satisfies Job;
