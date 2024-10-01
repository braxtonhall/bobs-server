import { CurrentlyWatching, logEpisode } from "../util/api";

type Episode = NonNullable<CurrentlyWatching["watching"]>["episodes"][number];

export const LogForm = (props: { episode: Episode; logEpisode: typeof logEpisode }) => <>{props.episode.name}</>;
