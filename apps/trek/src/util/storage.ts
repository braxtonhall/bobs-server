type StoreOptions<T> = {
	serialize: (input: T) => string;
	deserialize: (input: string) => T;
	validator?: (input: unknown) => input is T;
	default: () => T;
};

type PartialStoreOptions<T> = Pick<StoreOptions<T>, "default" | "validator">;

type Store<T> = (key: string) => Accessor<T>;

type Accessor<T> = {
	get: () => T;
	set: (value: T) => void;
};

type Stores<S extends Record<string, Store<any>>> = {
	[K in keyof S]: S[K] extends Store<infer T> ? Accessor<T> : never;
};

function store<T>(options: StoreOptions<T>): Store<T>;
function store<T>(options: PartialStoreOptions<T>): Store<T>;
function store<T>(options: Partial<StoreOptions<T>> & PartialStoreOptions<T>): Store<T> {
	options.serialize ??= (input: T): string => JSON.stringify(input);
	options.deserialize ??= (input: string): T => JSON.parse(input);
	options.validator ??= (input: unknown): input is T => true;
	return (key: string) => ({
		get: (): T => {
			try {
				const stored = localStorage.getItem(key);
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
		set: (value: T): void => localStorage.setItem(key, options.serialize!(value)),
	});
}

const stringArrayStore = store({
	default: () => [],
	validator: (input): input is string[] =>
		Array.isArray(input) && input.every((element) => typeof element === "string"),
});

const makeStore = <S extends Record<string, Store<any>>>(stores: S) =>
	Object.fromEntries(Object.entries(stores).map(([key, store]) => [key, store(key)])) as Stores<S>;

export const storage = makeStore({
	viewTags: stringArrayStore,
	watchlistTags: stringArrayStore,
});

export type Storage = typeof storage;
