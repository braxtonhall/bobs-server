import path from "node:path";
import fs from "fs/promises";

export const loadResource = (...paths: string[]) =>
	fs.readFile(path.join(__dirname, "..", "..", "resources", ...paths));
