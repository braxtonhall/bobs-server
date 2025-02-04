import { tmdb } from "../src/common/clients/tmdb.js";
import fs from "fs/promises";
import AsyncPool from "../src/util/AsyncPool.js";

const shows: number[] = [
	253, // tos
	1992, // tas
	655, // tng
	580, // ds9
	1855, // voy
	314, // ent
	67198, // dis
	82491, // st
	85949, // pic
	85948, // ld
	106393, // pro
	103516, // snw
	249278, // vst
	223530, // sfa
];

const movies: number[] = [
	1143894, // the cage
	152, // I
	154, // II
	157, // III
	168, // IV
	172, // V
	174, // VI
	193, // GEN
	199, // FC
	200, // INS
	201, // NEM
	13475, // 09
	54138, // ID
	188927, // BEY
	1114894, // S31
];
const concurrency = 3;

const getEpisode = async (id: number, seasonNumber: number, episodeNumber: number) =>
	tmdb.get(`tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`).json();

const getSeason = async (id: number, seasonNumber: number) => {
	const [season, credits] = (await Promise.all([
		tmdb.get(`tv/${id}/season/${seasonNumber}`).json(),
		tmdb.get(`tv/${id}/season/${seasonNumber}/credits`).json(),
	])) as any[];
	season.episodes = await AsyncPool.map(
		season.episodes as any[],
		(episode) => getEpisode(id, seasonNumber, episode.episode_number),
		concurrency,
	);
	return { ...season, ...credits };
};

const getShow = async (id: number) => {
	const show = (await tmdb.get(`tv/${id}`).json()) as Record<string, unknown>;
	show.seasons = await AsyncPool.map(
		show.seasons as any[],
		(season) => getSeason(id, season.season_number),
		concurrency,
	);
	return show;
};

const getMovie = async (id: number) => {
	const [movie, credits] = (await Promise.all([
		tmdb.get(`movie/${id}`).json(),
		tmdb.get(`movie/${id}/credits`).json(),
	])) as any[];
	return { ...movie, ...credits };
};

await fs.mkdir("resources/trek/tmdb/tv", { recursive: true });
await fs.mkdir("resources/trek/tmdb/movie", { recursive: true });

await AsyncPool.map(
	shows,
	async (id) => {
		const show = await getShow(id);
		await fs.writeFile(`resources/trek/tmdb/tv/${id}.json`, JSON.stringify(show, null, "\t"));
	},
	concurrency,
);

await AsyncPool.map(
	movies,
	async (id) => {
		const movie = await getMovie(id);
		await fs.writeFile(`resources/trek/tmdb/movie/${id}.json`, JSON.stringify(movie, null, "\t"));
	},
	concurrency,
);
