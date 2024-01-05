export function Ok(): Ok<undefined>;
export function Ok<T>(value: T): Ok<T>;
export function Ok(value?: unknown): Ok<unknown> {
	return { type: "ok", value };
}
type Ok<T> = { type: "ok"; value: T };

export const Err = <const E>(value: E): Err<E> => ({ type: "err", value });
type Err<E> = { type: "err"; value: E };

export type Result<T, E> = Ok<T> | Err<E>;
