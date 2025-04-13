#!/usr/bin/env node

import fs from "fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { Readable } from "node:stream";
import { z } from "zod";
import AsyncPool from "../src/util/AsyncPool.js";
import { fontManifestSchema, fonts } from "../src/toolbox/canvas/fonts.js";
import { multiply } from "../src/util/multiply.js";

const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const styles = ["normal", "italic", "oblique"];
const concurrency = 10;

const download = async (url: string, destination: string) => {
	const response = await fetch(url);
	if (response.ok) {
		const zip = createWriteStream(destination, { flags: "w" });
		await finished(Readable.fromWeb(response.body!).pipe(zip));
	} else {
		throw Error("Could not download this font");
	}
};

const listFonts = async ({ family, slug }: { family: string; slug: string }) => {
	const fonts = await AsyncPool.map(
		multiply(styles, weights),
		async ([style, weight]) => {
			const url = `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@latest/latin-${weight}-${style}.ttf`;
			const fontPath = `fonts/${slug}/ttf/${slug}-latin-${weight}-${style}.ttf`;
			await fs.mkdir(path.dirname(fontPath), { recursive: true }).catch(() => void "do nothing");
			try {
				await download(url, fontPath);
				return { family, style, weight: String(weight), path: fontPath };
			} catch {
				return null;
			}
		},
		concurrency,
	);
	return fonts.flat().filter((font) => !!font);
};

const main = async () => {
	const families = await AsyncPool.map(fonts, listFonts, concurrency);
	const manifest = families.flat() satisfies z.output<typeof fontManifestSchema>;
	await fs.writeFile("fonts/manifest.json", JSON.stringify(manifest, null, "\t"));
};
void main();
