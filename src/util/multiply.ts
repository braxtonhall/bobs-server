type Results<Lists extends unknown[][]> = Lists extends []
	? []
	: Lists extends [(infer First)[], ...infer Rest extends unknown[][]]
		? [First, ...Results<Rest>]
		: never;

export function* multiply<Lists extends [unknown[], ...unknown[][]]>(
	...[first, ...rest]: Lists
): Generator<Results<Lists>, void, unknown> {
	if (first) {
		for (const element of first) {
			for (const list of multiply(...(rest as any))) {
				// mutation would be much faster, but this is nicer to read i think
				yield [element, ...list] as Results<Lists>;
			}
		}
	} else {
		yield [] as Results<Lists>;
	}
}
