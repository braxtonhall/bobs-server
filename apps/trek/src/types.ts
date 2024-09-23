import type { Content } from "../../../src/trek/operations/getContent";

type Episode = Content["episodes"][number];
type Series = Content["series"];

const settings = Symbol(); // TODO
type UserSettings = typeof settings;

const search = Symbol();
type Search = typeof search;

export type { Content, Episode, UserSettings, Search, Series };
