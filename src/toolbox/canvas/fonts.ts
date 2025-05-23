import fs from "fs/promises";
import path from "node:path";
import { Job } from "../../jobs.js";
import { registerFont } from "canvas";
// import AsyncPool from "../../util/AsyncPool";
// import { createWriteStream } from "node:fs";
// import { finished } from "node:stream/promises";
// import { Readable } from "node:stream";
import { z } from "zod";
// import { multiply } from "../../util/multiply";

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

const manifestSchema = z.array(
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
		const manifest = manifestSchema.parse(JSON.parse(contents));
		for (const { family, weight, style, ...entry } of manifest) {
			registerFont(path.resolve(entry.path), { family, weight, style });
		}
	},
	interval: Infinity,
} satisfies Job;

// if (require.main === module) {
// 	const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
// 	const styles = ["normal", "italic", "oblique"];
// 	const concurrency = 10;
//
// 	const download = async (url: string, destination: string) => {
// 		const response = await fetch(url);
// 		if (response.ok) {
// 			const zip = createWriteStream(destination, { flags: "w" });
// 			await finished(Readable.fromWeb(response.body!).pipe(zip));
// 		} else {
// 			throw Error("Could not download this font");
// 		}
// 	};
//
// 	const listFonts = async ({ family, slug }: { family: string; slug: string }) => {
// 		const fonts = await AsyncPool.map(
// 			multiply(styles, weights),
// 			async ([style, weight]) => {
// 				const url = `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@latest/latin-${weight}-${style}.ttf`;
// 				const fontPath = `fonts/${slug}/ttf/${slug}-latin-${weight}-${style}.ttf`;
// 				await fs.mkdir(path.dirname(fontPath), { recursive: true }).catch(() => void "do nothing");
// 				try {
// 					await download(url, fontPath);
// 					return { family, style, weight: String(weight), path: fontPath };
// 				} catch {
// 					return null;
// 				}
// 			},
// 			concurrency,
// 		);
// 		return fonts.flat().filter((font) => !!font);
// 	};
//
// 	const main = async () => {
// 		const families = await AsyncPool.map(fonts, listFonts, concurrency);
// 		const manifest = families.flat() satisfies z.output<typeof manifestSchema>;
// 		await fs.writeFile("fonts/manifest.json", JSON.stringify(manifest, null, "\t"));
// 	};
// 	void main();
// }
