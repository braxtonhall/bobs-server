import { API } from "../../util/api.js";

export type SeriesCollection = Awaited<ReturnType<API["getSeries"]["query"]>>;
export type Viewings = Awaited<ReturnType<API["getCurrentlyWatching"]["query"]>>["viewings"];
export type Episode = Awaited<ReturnType<API["getEpisodeRelationships"]["query"]>>[number];
