interface None {
	(): None;
	type: "none";
}

export const None: None = () => None;
None.type = "none";

export const Some = <T>(value: T): Some<T> => ({ type: "some", value });
export type Some<T> = { type: "some"; value: T };

export type Option<T> = Some<T> | None;
