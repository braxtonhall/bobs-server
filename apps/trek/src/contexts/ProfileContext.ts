import { createContext, useContext } from "react";
import { API } from "../util/api";

export const ProfileContext = createContext<NonNullable<Awaited<ReturnType<API["getSelf"]["query"]>>> | null>(null);

export const useProfileContext = () => {
	const profileContext = useContext(ProfileContext);
	if (profileContext === null) {
		throw new Error("Profile Context was not set!");
	} else {
		return profileContext;
	}
};
