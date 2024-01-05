import "dotenv/config";
import { z } from "zod";

const warned =
	<D>(key: string, defaultValue: D) =>
	() => {
		console.warn(`Environment variable "${key}" was not set. Using default value: "${defaultValue}"`);
		return defaultValue;
	};

const Config = z
	.object({
		SSL_CERT_PATH: z.string(),
		SSL_KEY_PATH: z.string(),
		HTTP_PORT: z.coerce.number().default(warned("HTTP_PORT", 80)),
		HTTPS_PORT: z.coerce.number().default(warned("HTTPS_PORT", 443)),
		DEFAULT_PAGE_SIZE: z.coerce.number().default(warned("DEFAULT_PAGE_SIZE", 20)),
		MAXIMUM_PAGE_SIZE: z.coerce.number().default(warned("MAXIMUM_PAGE_SIZE", 100)),
		DELETION_TIME_MS: z.coerce.number().default(warned("DELETION_TIME_MS", 1000 * 60 * 10)),
		KARMA_KILL_THRESHOLD: z.coerce.number().default(warned("KARMA_KILL_THRESHOLD", 5)),
	})
	.parse(process.env);

export default Config;
