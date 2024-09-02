import { promises as fs, existsSync } from "fs";
import path from "path";

type Import = Record<string | symbol, unknown>;
type Importer = (path: string) => Promise<Import>;

/**
 * Recursively lists all files in a directory, with the files full path starting with
 * the provided `path`
 * @param path
 */
const fileSystemList = async (path: string): Promise<string[]> => {
	const entries = [
		...(await ifExists(path, listDirectory, () => Promise.resolve([]))(path)),
		...ifExists(`${path}.ts`, [`${path}.ts`], []),
		...ifExists(`${path}.js`, [`${path}.js`], []),
	];
	if (entries.length > 0) {
		return entries;
	} else {
		throw new Error(`Supplied module/directory "${path}" does not exist`);
	}
};

const ifExists = <T, E>(path: string, then: T, otherwise: E): T | E => {
	if (existsSync(path)) {
		return then;
	} else {
		return otherwise;
	}
};

const listDirectory = async (directory: string): Promise<string[]> => {
	const shallowEntries = await fs.readdir(directory);
	const futureEntries = shallowEntries.map((entry) => `${directory}/${entry}`).map(listDirectoryEntry);
	return Promise.all(futureEntries).then((entries) => entries.flat());
};

const isDirectory = async (path: string) => {
	const stats = await fs.stat(path);
	return stats.isDirectory();
};

const listDirectoryEntry = async (path: string) => {
	if (await isDirectory(path)) {
		return listDirectory(path);
	} else {
		return [path];
	}
};

/**
 * Chooses which files should be used to import.
 * @param files
 */
const selectFiles = (files: string[]): string[] => {
	const modulePostfix = /\.[jt]s$/;
	const declarationPostfix = /\.d\.[jt]s$/;
	const nodeFiles = files
		.filter((name) => name.match(modulePostfix) && !name.match(declarationPostfix))
		.map((name) => name.replace(modulePostfix, ""));
	return [...new Set(nodeFiles)];
};

const defaultImporter: Importer = (file) => import(file);

const importFile = (importer: Importer) => async (file: string) => {
	try {
		return await importer(file);
	} catch (error) {
		console.error(`Could not import "${file}"`, error);
		return {};
	}
};

/**
 * Batch imports all exported members from a file or directory (including all subdirectories)
 * @param filePath
 * @param importer
 */
const batchImport = async (filePath: string, importer: Importer = defaultImporter): Promise<Set<Import>> => {
	if (path.isAbsolute(filePath)) {
		const files = await fileSystemList(filePath).then(selectFiles);
		const futureImportedFiles = files.map(importFile(importer));
		return Promise.all(futureImportedFiles).then((imports) => new Set(imports));
	} else {
		throw new Error("Path argument must be absolute");
	}
};

export default batchImport;
