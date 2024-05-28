import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
	SSL_CERT_PATH: z.string(),
	SSL_KEY_PATH: z.string(),
	SENDGRID_API_KEY: z.string(),
	EMAIL_FROM: z.string(),
	JWT_SECRET: z.string(),
	HOST: z.string(),
	LOGIN_TOKEN_EXPIRATION_MIN: z.coerce.number().default(10),
	API_TOKEN_EXPIRATION_HOURS: z.coerce.number().default(12),
	VERIFY_TOKEN_EXPIRATION_DAYS: z.coerce.number().default(90),
	TOKEN_CLEANUP_INTERVAL_HOURS: z.coerce.number().default(4),
	EXPIRED_TOKEN_STORAGE_HOURS: z.coerce.number().default(12),
	HTTP_PORT: z.coerce.number().default(80),
	HTTPS_PORT: z.coerce.number().default(443),
	DEFAULT_PAGE_SIZE: z.coerce.number().default(20),
	MAXIMUM_PAGE_SIZE: z.coerce.number().default(100),
	DELETION_TIME_MS: z.coerce.number().default(1000 * 60 * 10),
	KARMA_KILL_THRESHOLD: z.coerce.number().default(5),
	EMAIL_DISABLED: z
		.string()
		.optional()
		.transform((string) => string === "true"),
});

const Config = environmentSchema.parse(process.env);

export default Config;
