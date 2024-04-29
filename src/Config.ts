import "dotenv/config";
import { z } from "zod";

type Config = {
	[K in keyof typeof environmentSchema]: z.infer<ReturnType<(typeof environmentSchema)[K]>>;
};

const requiredString = () => z.string();

const numberWithDefault = (defaultValue: number) => (key: string) =>
	z.coerce.number().default(() => {
		console.warn(`Environment variable "${key}" was not set. Using default value: "${defaultValue}"`);
		return defaultValue;
	});

const environmentSchema = {
	SSL_CERT_PATH: requiredString,
	SSL_KEY_PATH: requiredString,
	SENDGRID_API_KEY: requiredString,
	JWT_SECRET: requiredString,
	TEMP_TOKEN_EXPIRATION_MIN: numberWithDefault(10),
	API_TOKEN_EXPIRATION_HOURS: numberWithDefault(12),
	HTTP_PORT: numberWithDefault(80),
	HTTPS_PORT: numberWithDefault(443),
	DEFAULT_PAGE_SIZE: numberWithDefault(20),
	MAXIMUM_PAGE_SIZE: numberWithDefault(100),
	DELETION_TIME_MS: numberWithDefault(1000 * 60 * 10),
	KARMA_KILL_THRESHOLD: numberWithDefault(5),
};

const validatedConfig: Record<string, unknown> = {};

const Config = new Proxy({} as Config, {
	get(_: Config, key: keyof Config): Config[typeof key] {
		validatedConfig[key] ??= environmentSchema[key](key).parse(process.env[key]);
		return validatedConfig[key] as Config[typeof key];
	},
});

export default Config;
