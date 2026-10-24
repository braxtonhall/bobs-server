import { AddressInfo } from "net";
import Config from "../src/Config";
import { createApp, getServers } from "../src/server";

describe("getServers", () => {
	const original = { ...Config };
	afterEach(() => Object.assign(Config, original));

	it("serves the whole site over plain HTTP when there is no certificate", async () => {
		Object.assign(Config, { SSL_CERT_PATH: undefined, SSL_KEY_PATH: undefined });
		const { http, https } = await getServers();
		expect(https).toBeUndefined();
		http.listen(0);
		try {
			const { port } = http.address() as AddressInfo;
			const api = await fetch(`http://127.0.0.1:${port}/api`, { redirect: "manual" });
			expect(api.status).toBe(200);
			expect(await api.text()).toBe("API");
			const login = await fetch(`http://127.0.0.1:${port}/login`, { redirect: "manual" });
			expect(login.status).toBe(200);
		} finally {
			await new Promise((resolve) => http.close(resolve));
		}
	});

	it("applies TRUST_PROXY", () => {
		Object.assign(Config, { TRUST_PROXY: "uniquelocal" });
		const trusts = createApp().get("trust proxy fn") as (address: string, hop: number) => boolean;
		expect(trusts("172.18.0.2", 0)).toBe(true);
		expect(trusts("203.0.113.7", 0)).toBe(false);
	});

	it("trusts no proxy by default", () => {
		Object.assign(Config, { TRUST_PROXY: undefined });
		const trusts = createApp().get("trust proxy fn") as (address: string, hop: number) => boolean;
		expect(trusts("172.18.0.2", 0)).toBe(false);
	});
});
