type SomeOf<Args extends any[]> = Args extends []
	? []
	: Args extends [infer First, ...infer Rest]
		? [First] | [First, ...SomeOf<Rest>]
		: never;

type RestOf<Args extends any[], Supplied extends any[]> = Supplied extends []
	? Args
	: [Args, Supplied] extends [[unknown, ...infer RestArgs], [unknown, ...infer RestSupplied]]
		? RestOf<RestArgs, RestSupplied>
		: never;

export const curry =
	<F extends (...args: any[]) => unknown, Supplied extends SomeOf<Parameters<F>>>(
		callback: F,
		...supplied: Supplied
	) =>
	(...args: RestOf<Parameters<F>, Supplied>): ReturnType<F> =>
		callback(...supplied, ...args) as ReturnType<F>;
