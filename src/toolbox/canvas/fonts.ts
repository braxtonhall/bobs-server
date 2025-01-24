import fs from "fs/promises";
import path from "node:path";
import { Job } from "../../jobs";
import { registerFont } from "canvas";
import AsyncPool from "../../util/AsyncPool";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { Readable } from "node:stream";
import * as unzipper from "unzipper";
import { z } from "zod";
import { multiply } from "../../util/multiply";

// fonts come from https://fontsource.org/
export const fonts = [
	{ family: "EB Garamond", slug: "eb-garamond" },
	{ family: "Courier Prime", slug: "courier-prime" },
	{ family: "Montserrat", slug: "montserrat" },
	{ family: "Roboto", slug: "roboto" },
	{ family: "Merriweather", slug: "merriweather" },
	{ family: "Parisienne", slug: "parisienne" },
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

if (require.main === module) {
	const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
	const styles = ["normal", "italic", "oblique"];
	const concurrency = 3;

	const exists = (filename: string): Promise<boolean> =>
		fs
			.stat(filename)
			.then(() => true)
			.catch(() => false);

	const download = async (url: string, destination: string) => {
		const zip = createWriteStream(destination, { flags: "w" });
		const response = await fetch(url);
		await finished(Readable.fromWeb(response.body!).pipe(zip));
	};

	const unzip = async (zipPath: string, destination: string) => {
		const directory = await unzipper.Open.file(zipPath);
		await directory.extract({ path: destination });
	};

	const listFonts = async ({ family, slug }: { family: string; slug: string }) => {
		const fonts = await AsyncPool.map(
			multiply(styles, weights),
			async ([style, weight]) => {
				const path = `fonts/${slug}/ttf/${slug}-latin-${weight}-${style}.ttf`;
				if (await exists(path)) {
					return { family, style, weight: String(weight), path };
				} else {
					return null;
				}
			},
			concurrency,
		);
		return fonts.flat().filter((font) => !!font);
	};

	const downloadFamilyAndListFonts = async ({ family, slug }: { family: string; slug: string }) => {
		const zipPath = `fonts/${slug}.zip`;
		const fontUrl = `https://r2.fontsource.org/fonts/${slug}@latest/download.zip`;
		const unzipPath = `fonts/${slug}`;

		await download(fontUrl, zipPath);
		await unzip(zipPath, unzipPath);
		await fs.unlink(zipPath);

		return listFonts({ family, slug });
	};

	const main = async () => {
		if (!(await exists("fonts"))) {
			await fs.mkdir("fonts");
		}
		const families = await AsyncPool.map(fonts, downloadFamilyAndListFonts, concurrency);
		const manifest = families.flat() satisfies z.output<typeof manifestSchema>;
		await fs.writeFile("fonts/manifest.json", JSON.stringify(manifest, null, "\t"));
	};
	void main();
}
