import type { CurrentlyWatching } from "../../../../src/trek/operations/getCurrentlyWatching";
import type { SeriesCollection } from "../../../../src/trek/operations/getSeries";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mn0.hloW4K9TeFlUDNzNoHrvd9OWEKksZhmAI74F1aN3sGI";

type Options = {
	method?: string;
	payload?: unknown;
};

const request = (url: string, options?: Options) =>
	fetch(url, {
		headers: { authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
		method: options?.method,
		body: JSON.stringify(options?.payload),
	}).then((res) => res.json());

export const getCurrentlyWatching = (): Promise<CurrentlyWatching> => request("/api/trek/watching");

export const getSeries = (): Promise<SeriesCollection> => request("/api/trek/series");

export const updateCursor = (id: string | null): Promise<void> =>
	request("/api/trek/cursor", { payload: { id }, method: "POST" });

export type { CurrentlyWatching, SeriesCollection };
