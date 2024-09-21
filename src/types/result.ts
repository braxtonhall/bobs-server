import { match, P } from "ts-pattern";

export function Ok(): Ok<undefined>;
export function Ok<T>(value: T): Ok<T>;
export function Ok(value?: unknown): Ok<unknown> {
	return { type: "ok", value };
}
type Ok<T> = { type: "ok"; value: T };

export const Err = <const E>(value: E): Err<E> => ({ type: "err", value });
type Err<E> = { type: "err"; value: E };

export type Result<T, E> = Ok<T> | Err<E>;

export const map = <T, E, U>(result: Result<T, E>, callback: (value: T) => U): Result<U, E> =>
	match(result as any) // Type instantiation is excessively deep and possibly infinite.
		.with(Ok(P.select()), (value): Ok<U> => Ok(callback(value as T)))
		.otherwise((error: Err<E>) => error);

export const unwrapOr = <T, E, U>(result: Result<T, E>, or: (e: E) => U): T | U =>
	match(result as any) // Type instantiation is excessively deep and possibly infinite.
		.with(Ok(P.select()), (value): T => value as T)
		.otherwise(or);

export const unsafeUnwrap = <T, E>(result: Result<T, E>): T => unwrapOr(result, () => ({}) as never);
