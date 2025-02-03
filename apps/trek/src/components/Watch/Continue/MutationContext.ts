import { createContext, useContext } from "react";
import { API } from "../../../util/api.js";

export const MutationContext = createContext<{
	setCursor: (opts: Parameters<API["updateCursor"]["mutate"]>[0]) => void;
	logEpisode: (opts: Parameters<API["logEpisode"]["mutate"]>[0]) => void;
} | null>(null);

export const useMutationContext = () => {
	const context = useContext(MutationContext);
	if (context === null) {
		throw new Error("MutationContext was not set!");
	}
	return context;
};
