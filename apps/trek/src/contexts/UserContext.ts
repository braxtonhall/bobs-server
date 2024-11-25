import { createContext } from "react";
import { API } from "../util/api";
import { useSafeContext } from "../hooks/useSafeContext";

type Settings = NonNullable<Awaited<ReturnType<API["getSelf"]["query"]>>["settings"]>;

type User = {
	settings: Settings;
	setSettings: (settings: Settings) => void;
};

export const defaultSettings: Settings = {
	colours: {},
	isSpoilerEpisodeReviewCommentSpoilerTag: true,
	isSpoilerEpisodeName: false,
	isSpoilerEpisodePicture: false,
	isSpoilerEpisodeDescription: false,
	isSpoilerEpisodeReviewComment: false,
	isSpoilerEpisodeReviewScore: false,
	isSpoilerEpisodeRating: false,
};

export const UserContext = createContext<User | null>(null);

export const useUserContext = () => useSafeContext(UserContext);
