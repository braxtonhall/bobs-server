import { DateTime, Duration } from "luxon";

const ttl = Duration.fromObject({ months: 1 });

type Record = { time: number; value: string };

const isRecord = (record: unknown): record is Record =>
	!!record &&
	typeof record === "object" &&
	"time" in record &&
	"value" in record &&
	typeof record.time === "number" &&
	typeof record.value === "string";

const read = (key: string): Record | null => {
	try {
		const record = JSON.parse(localStorage.getItem(key) ?? "{}");
		if (isRecord(record) && !isExpired(record)) {
			return record;
		}
	} catch {}
	remove(key);
	return null;
};

const isExpired = (record: Record): boolean => DateTime.now().minus(ttl).toMillis() > record.time;

export const get = (key: string): string | null => {
	try {
		const record = read(key);
		if (record !== null) {
			set(key, record.value);
			return record.value;
		}
	} catch {}
	return null;
};

export const set = (key: string, value: string): void =>
	localStorage.setItem(
		key,
		JSON.stringify({
			time: DateTime.now().toMillis(),
			value,
		} satisfies Record),
	);

export const remove = (key: string): void => localStorage.removeItem(key);

for (const key of Object.keys(localStorage)) {
	read(key);
}

const storage = { get, set, remove };

export default storage;
