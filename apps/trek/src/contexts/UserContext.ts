import { createContext } from "react";
import { API } from "../util/api";

type Settings = NonNullable<Awaited<ReturnType<API["getSettings"]["query"]>>>;

type User = {
	settings: Settings;
	setSettings: (settings: Settings) => void;
};

export const defaultSettings: Settings = {
	colours: {},
	isSpoilerEpisodeReviewSpoilerTag: true,
	isSpoilerEpisodeName: false,
	isSpoilerEpisodePicture: false,
	isSpoilerEpisodeDescription: false,
	isSpoilerEpisodeReview: false,
	isSpoilerEpisodeRating: false,
};

export const UserContext = createContext<User>({
	settings: defaultSettings,
	setSettings: () => void "shouldn't get used",
});
