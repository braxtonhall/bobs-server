import { createContext, useContext } from "react";
import { API } from "../util/api";

type Settings = NonNullable<Awaited<ReturnType<API["getSettings"]["query"]>>>;

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

export const useUserContext = () => {
	const userContext = useContext(UserContext);
	if (userContext === null) {
		throw new Error("User Context was not set!");
	} else {
		return userContext;
	}
};
