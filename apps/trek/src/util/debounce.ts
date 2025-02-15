export const debounce = <F extends (...arg: any) => void>(callback: F, waitMs: number) => {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<F>) => {
		clearTimeout(timeout);
		timeout = setTimeout(callback, waitMs, ...args);
	};
};
