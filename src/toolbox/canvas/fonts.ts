import fs from "fs/promises";
import path from "node:path";
import { Job } from "../../jobs";
import { registerFont } from "canvas";
import AsyncPool from "../../util/AsyncPool";
import { multiply } from "../../util/multiply";
import manifest from "../../../package.json";

type SlugOf<S extends `@fontsource/${string}`> = S extends `@fontsource/${infer Slug}` ? Slug : never;
type FontSlug = SlugOf<`@fontsource/${string}` & keyof typeof manifest.dependencies>;

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
] as const satisfies { family: string; slug: FontSlug }[];

type Families<A extends { family: unknown }[]> = A extends []
	? []
	: A extends [infer First extends { family: unknown }, ...infer Rest extends { family: unknown }[]]
		? [First["family"], ...Families<Rest>]
		: never;

export const fontFamilies = fonts.map(({ family }) => family) as Families<typeof fonts>;

type Manifest = { family: string; weight: string; style: string; path: string }[];

const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const styles = ["normal", "italic", "oblique"];
const formats = ["woff2", "woff", "ttf"];
const concurrency = 3;

const exists = (filename: string): Promise<boolean> =>
	fs
		.stat(filename)
		.then(() => true)
		.catch(() => false);

const listFonts = async ({ family, slug }: { family: string; slug: string }) => {
	const fonts = await AsyncPool.map(
		multiply(styles, weights),
		async ([style, weight]) => {
			for (const format of formats) {
				const path = `node_modules/@fontsource/${slug}/files/${slug}-latin-${weight}-${style}.${format}`;
				if (await exists(path)) {
					return { family, style, weight: String(weight), path };
				}
			}
			return null;
		},
		concurrency,
	);
	return fonts.flat().filter((font) => !!font);
};

export const loadFonts = {
	callback: async () => {
		const families = await AsyncPool.map(fonts, listFonts, concurrency);
		const manifest: Manifest = families.flat();
		for (const { family, weight, style, ...entry } of manifest) {
			registerFont(path.resolve(entry.path), { family, weight, style });
		}
	},
	interval: Infinity,
} satisfies Job;
