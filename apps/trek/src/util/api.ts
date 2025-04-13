import type { TrekRouter } from "../../../../src/trek/routers/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

export const api = createTRPCProxyClient<TrekRouter>({
	links: [
		httpBatchLink({
			url: "/api/trek/trpc",
		}),
	],
});

export type API = typeof api;
