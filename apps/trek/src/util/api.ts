import type { TrekRouter } from "../../../../src/trek/routers/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDU2fQ.eQROq-9PBpPsbST0-7uRl8vn7zhJL1hWWXyDp9T1y7w";

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
