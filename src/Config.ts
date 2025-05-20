import "dotenv/config";
import { z } from "zod";

export default z
	.object({
		SSL_CERT_PATH: z.string(),
		SSL_KEY_PATH: z.string(),
		SENDGRID_API_KEY: z.string(),
		EMAIL_FROM: z.string(),
		JWT_SECRET: z.string(),
		SESSION_SECRET: z.string(),
		HOST: z.string(),
		LOGIN_TOKEN_EXPIRATION_MIN: z.coerce.number().nonnegative().default(10),
		API_TOKEN_EXPIRATION_HOURS: z.coerce.number().nonnegative().default(12),
		VERIFY_TOKEN_EXPIRATION_DAYS: z.coerce.number().nonnegative().default(90),
		TOKEN_CLEANUP_INTERVAL_HOURS: z.coerce.number().nonnegative().default(4),
		EXPIRED_TOKEN_STORAGE_HOURS: z.coerce.number().nonnegative().default(12),
		HTTP_PORT: z.coerce.number().positive().default(80),
		HTTPS_PORT: z.coerce.number().positive().default(443),
		DEFAULT_PAGE_SIZE: z.coerce.number().positive().default(20),
		MINIMUM_PAGE_SIZE: z.coerce.number().positive().default(1),
		MAXIMUM_PAGE_SIZE: z.coerce.number().positive().default(100),
		DELETION_TIME_MIN: z.coerce.number().nonnegative().default(10),
		KARMA_KILL_THRESHOLD: z.coerce.number().positive().default(5),
		EMAIL_DISABLED: z
			.string()
			.optional()
			.transform((string) => string === "true"),
		DEFAULT_MAX_LENGTH: z.coerce.number().int().positive().default(100),
		DESCRIPTION_MAX_LENGTH: z.coerce.number().int().positive().default(500),
		COMMENT_MAX_LENGTH: z.coerce.number().int().positive().default(2000),
		SUBSCRIPTION_DIGEST_INTERVAL_HOURS: z.coerce.number().nonnegative().default(4),
		SUBSCRIPTION_DIGEST_DELAY_HOURS: z.coerce.number().nonnegative().default(12),
		REMINDER_INTERVAL_HOURS: z.coerce.number().nonnegative().default(4),
		REMINDER_DELAY_HOURS: z.coerce.number().nonnegative().default(48),
		SEASON_ARCHIVE_INTERVAL_HOURS: z.coerce.number().nonnegative().default(4),
		MINIMUM_GAME_DAYS: z.coerce.number().nonnegative().default(7),
		MINIMUM_GRACE_DAYS: z.coerce.number().nonnegative().default(7),
		NODE_ENV: z.enum(["development", "production", "test"]),
		DEFAULT_COUNTER_IMG_WIDTH: z.coerce.number().positive().default(200),
		MAX_COUNTER_IMG_WIDTH: z.coerce.number().positive().default(800),
		DEFAULT_COUNTER_IMG_HEIGHT: z.coerce.number().positive().default(100),
		MAX_COUNTER_IMG_HEIGHT: z.coerce.number().positive().default(400),
		MAX_ACTIVE_LOGIN_TOKENS: z.coerce.number().int().positive().default(3),
		RECAPTCHA_SITE_KEY: z.string(),
		RECAPTCHA_SECRET_KEY: z.string(),
		DOCUMENT_DIR: z.string(),
		WS_PING_PONG_TIMEOUT_MS: z.coerce.number().positive().default(30000),
	})
	.parse(process.env);
