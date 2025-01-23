import fs from "fs/promises";
import path from "node:path";
import { Job } from "../../jobs";
import { registerFont } from "canvas";
import AsyncPool from "../../util/AsyncPool";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { Readable } from "node:stream";
import * as unzipper from "unzipper";

// fonts come from https://fontsource.org/
export const fonts = [
	{ family: "EB Garamond", slug: "eb-garamond" },
	{ family: "Courier Prime", slug: "courier-prime" },
] as const satisfies { family: string; slug: string }[];

type Families<A extends { family: unknown }[]> = A extends []
	? []
	: A extends [infer First extends { family: unknown }, ...infer Rest extends { family: unknown }[]]
		? [First["family"], ...Families<Rest>]
		: never;

export const fontFamilies = fonts.map(({ family }) => family) as Families<typeof fonts>;

export type Font = {
	family: string;
	style: string;
	weight: string;
	path: string;
};

export const loadFonts = {
	callback: async () => {
		const manifest = JSON.parse(await fs.readFile("fonts/manifest.json", "utf-8")) as Font[];
		for (const { family, weight, style, ...entry } of manifest) {
			registerFont(path.resolve(entry.path), { family, weight, style });
		}
	},
	interval: Infinity,
} satisfies Job;

function* multiply<A, B>(as: A[], bs: B[]): Generator<[A, B], void, unknown> {
	for (const a of as) {
		for (const b of bs) {
			yield [a, b];
		}
	}
}

if (require.main === module) {
	const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

	const styles = ["normal", "italic", "oblique"];

	const exists = (filename: string): Promise<boolean> =>
		fs
			.stat(filename)
			.then(() => true)
			.catch(() => false);

	type ManifestEntry = { family: string; weight: string; style: string; path: string };

	(async () => {
		if (!(await exists("fonts"))) {
			await fs.mkdir("fonts");
		}
		const manifest: ManifestEntry[] = [];
		await AsyncPool.map(
			fonts,
			async ({ family, slug }) => {
				const zipPath = `fonts/${slug}.zip`;
				const zip = createWriteStream(zipPath, { flags: "w" });
				const response = await fetch(`https://r2.fontsource.org/fonts/${slug}@latest/download.zip`);
				await finished(Readable.fromWeb(response.body!).pipe(zip));

				const directory = await unzipper.Open.file(zipPath);
				await directory.extract({ path: `fonts/${slug}` });
				await fs.unlink(zipPath);

				await AsyncPool.map(
					multiply(styles, weights),
					async ([style, weight]) => {
						const path = `fonts/${slug}/ttf/${slug}-latin-${weight}-${style}.ttf`;
						if (await exists(path)) {
							manifest.push({
								family,
								style,
								weight: String(weight),
								path,
							});
						}
					},
					3,
				);
			},
			3,
		);
		await fs.writeFile("fonts/manifest.json", JSON.stringify(manifest, null, "\t"));
	})();
}
