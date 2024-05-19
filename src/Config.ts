import "dotenv/config";
import { z } from "zod";

const numberWithDefault = (defaultValue: number) => z.coerce.number().default(defaultValue);

const environmentSchema = z.object({
	SSL_CERT_PATH: z.string(),
	SSL_KEY_PATH: z.string(),
	SENDGRID_API_KEY: z.string(),
	JWT_SECRET: z.string(),
	HOST: z.string(),
	TEMP_TOKEN_EXPIRATION_MIN: numberWithDefault(10),
	API_TOKEN_EXPIRATION_HOURS: numberWithDefault(12),
	HTTP_PORT: numberWithDefault(80),
	HTTPS_PORT: numberWithDefault(443),
	DEFAULT_PAGE_SIZE: numberWithDefault(20),
	MAXIMUM_PAGE_SIZE: numberWithDefault(100),
	DELETION_TIME_MS: numberWithDefault(1000 * 60 * 10),
	KARMA_KILL_THRESHOLD: numberWithDefault(5),
});

const Config = environmentSchema.parse(process.env);

export default Config;
