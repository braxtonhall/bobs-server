export default class AsyncPool {
	public static map<T extends readonly unknown[] | [], U>(
		values: T,
		callback: (v: T[number]) => U,
		concurrency: number,
	): Promise<{ -readonly [P in keyof T]: Awaited<U> }>;
	public static map<T, U>(values: Iterable<T>, callback: (v: T) => U, concurrency: number): Promise<Awaited<U>[]>;
	public static map<T, U>(values: Iterable<T>, callback: (v: T) => U, concurrency: number): Promise<unknown> {
		return Promise.all(this.mapIterable(values, callback, concurrency));
	}

	public static mapToSettled<T extends readonly unknown[] | [], U>(
		values: T,
		callback: (v: T[number]) => U,
		concurrency: number,
	): Promise<{ -readonly [P in keyof T]: PromiseSettledResult<Awaited<U>> }>;
	public static mapToSettled<T, U>(
		values: Iterable<T>,
		callback: (v: T) => U,
		concurrency: number,
	): Promise<PromiseSettledResult<Awaited<U>>[]>;
	public static mapToSettled<T, U>(
		values: Iterable<T>,
		callback: (v: T) => U,
		concurrency: number,
	): Promise<unknown> {
		return Promise.allSettled(this.mapIterable(values, callback, concurrency));
	}

	private static *mapIterable<T, U>(
		values: Iterable<T>,
		callback: (v: T) => U,
		concurrency: number,
	): Generator<Promise<U>> {
		const pool = new AsyncPool(concurrency);
		for (const value of values) {
			yield pool.run(() => callback(value));
		}
	}

	private readonly queue: Array<() => void> = [];
	private running: Set<Promise<unknown>> = new Set<Promise<unknown>>();
	constructor(private readonly concurrency: number) {
		if (!(concurrency > 0)) {
			// Don't flip this! This also filters out NaN and null
			throw new TypeError("Concurrency must be a positive number");
		}
	}

	private next(): void {
		if (this.running.size < this.concurrency) {
			this.queue.shift()?.();
		}
	}

	public run<T>(process: () => T): Promise<Awaited<T>> {
		return new Promise((resolve, reject) => {
			this.queue.push((): void => {
				const promise: Promise<unknown> = (async (): Promise<Awaited<T>> => await process())()
					.finally(() => this.running.delete(promise))
					.finally(() => this.next())
					.then(resolve)
					.catch(reject);
				this.running.add(promise);
			});
			return this.next();
		});
	}

	public get executing(): number {
		return this.running.size;
	}

	public get queued(): number {
		return this.queue.length;
	}

	public async drain(): Promise<void> {
		await Promise.all(this.running);
	}
}
