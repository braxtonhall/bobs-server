#!/usr/bin/env node

import AsyncPool from "../src/util/AsyncPool.js";
import { multiply } from "../src/util/multiply.js";
import { z } from "zod";
import fs from "fs/promises";
import { fontManifestSchema, fonts } from "../src/toolbox/canvas/fonts.js";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { Readable } from "node:stream";
import * as unzipper from "unzipper";

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
	console.log("downloading fonts");
	if (!(await exists("fonts"))) {
		await fs.mkdir("fonts");
	}
	const families = await AsyncPool.map(fonts, downloadFamilyAndListFonts, concurrency);
	const manifest = families.flat() satisfies z.output<typeof fontManifestSchema>;
	await fs.writeFile("fonts/manifest.json", JSON.stringify(manifest, null, "\t"));
};
void main();
