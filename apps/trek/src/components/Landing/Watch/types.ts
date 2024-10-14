import { API } from "../../../util/api";

export type SeriesCollection = Awaited<ReturnType<API["getSeries"]["query"]>>;
export type Viewings = Awaited<ReturnType<API["getCurrentlyWatching"]["query"]>>["viewings"];
