import { match, P } from "ts-pattern";

export interface None {
	(): None;
	type: "none";
}

export const None: None = () => None;
None.type = "none";

export const Some = <T>(value: T): Some<T> => ({ type: "some", value });
export type Some<T> = { type: "some"; value: T };

export type Option<T> = Some<T> | None;

export const map = <T, U>(result: Option<T>, callback: (value: T) => U): Option<U> =>
	match(result)
		.with(Some(P.select()), (value): Some<U> => Some(callback(value as T)))
		.otherwise(None);

export const unwrapOr = <T, U>(optional: Option<T>, or: U): T | U =>
	match(optional)
		.with(Some(P.select()), (value): T => value as T)
		.otherwise(() => or);

export const unsafeUnwrap = <T>(optional: Option<T>): T => unwrapOr(optional, {} as never);
