import type { TrekRouter } from "../../../../src/trek/routers/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mn0.hloW4K9TeFlUDNzNoHrvd9OWEKksZhmAI74F1aN3sGI";

const getAuthCookie = () => `Bearer ${TOKEN}`; // TODO

export const api = createTRPCProxyClient<TrekRouter>({
	links: [
		httpBatchLink({
			url: "/api/trek/trpc",
			headers: async () => ({ authorization: getAuthCookie() }),
		}),
	],
});

export type API = typeof api;
