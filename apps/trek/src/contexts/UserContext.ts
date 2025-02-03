import { createContext } from "react";
import { API } from "../util/api.js";
import { useSafeContext } from "../hooks/useSafeContext.js";

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
	gravatar: false,
};

export const UserContext = createContext<User | null>(null);

export const useUserContext = () => useSafeContext(UserContext);
