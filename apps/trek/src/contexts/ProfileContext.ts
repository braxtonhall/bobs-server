import { createContext, useContext } from "react";
import { API } from "../util/api";

type ProfileContextContent = NonNullable<Awaited<ReturnType<API["getSelf"]["query"]>>> & {
	setSelf: ((opts: Parameters<API["setSelf"]["mutate"]>[0]) => void) | null;
};

export const ProfileContext = createContext<ProfileContextContent | null>(null);

export const useProfileContext = () => {
	const profileContext = useContext(ProfileContext);
	if (profileContext === null) {
		throw new Error("Profile Context was not set!");
	} else {
		return profileContext;
	}
};
