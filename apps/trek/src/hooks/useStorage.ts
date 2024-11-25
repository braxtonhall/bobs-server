import { useMemo } from "react";
import storage from "../util/storage";

type StoreOptions<T> = {
	serialize: (input: T) => string;
	deserialize: (input: string) => T;
	validator?: (input: unknown) => input is T;
	default: () => T;
};

type PartialStoreOptions<T> = Pick<StoreOptions<T>, "default" | "validator">;

type Store<T> = (...keys: [StorageKind, ...string[]]) => Accessor<T>;

type Accessor<T> = {
	get: () => T;
	set: (value: T) => void;
	clear: () => void;
};

function store<T>(options: StoreOptions<T>): Store<T>;
function store<T>(options: PartialStoreOptions<T>): Store<T>;
function store<T>(options: Partial<StoreOptions<T>> & PartialStoreOptions<T>): Store<T> {
	options.serialize ??= (input: T): string => JSON.stringify(input);
	options.deserialize ??= (input: string): T => JSON.parse(input);
	options.validator ??= (input: unknown): input is T => true;
	return (...keys: [StorageKind, ...string[]]) => {
		const key = keys.join(",");
		return {
			get: (): T => {
				try {
					const stored = storage.get(key);
					if (stored) {
						const value = options.deserialize!(stored);
						if (options.validator!(value)) {
							return value;
						}
					}
				} catch {
					// Do nothing
				}
				return options.default();
			},
			set: (value: T): void => storage.set(key, options.serialize!(value)),
			clear: (): void => storage.remove(key),
		};
	};
}

export enum StorageKind {
	StringList = "strings",
	Theme = "theme",
}

const stores = {
	[StorageKind.StringList]: store({
		default: () => [],
		validator: (input): input is string[] =>
			Array.isArray(input) && input.every((element) => typeof element === "string"),
	}),
	[StorageKind.Theme]: store<"light" | "system" | "dark">({
		default: () => "system",
		validator: (input): input is "light" | "system" | "dark" =>
			(["light", "system", "dark"] as unknown[]).includes(input),
	}),
} satisfies { [K in StorageKind]: Store<any> };

type Stores = typeof stores;

export type Storage = {
	[K in keyof Stores]: Stores[K] extends Store<infer T> ? Accessor<T> : never;
};

export const useStorage = <K extends StorageKind>(kind: K, ...keys: [...string[]]): Storage[K] =>
	useMemo(() => stores[kind](kind, ...keys) as Storage[K], [kind, keys]);
