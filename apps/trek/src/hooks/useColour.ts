import { useUserContext } from "../contexts/UserContext.js";
import { useMemo } from "react";

const defaultColour = "#ffffff00";

export const defaultColours: Record<string, string> = {
	TOS: "#fff2ccff",
	TOSM: "#fff2ccff",
	TAS: "#fce5cdff",
	TNG: "#c9daf8ff",
	TNGM: "#c9daf8ff",
	DS9: "#d9d2e9ff",
	VOY: "#f4ccccff",
	ENT: "#d9eAd3ff",
};

export const useColour = (episode?: { seriesId: string }): string => {
	const {
		settings: { colours },
	} = useUserContext();
	return useMemo(() => {
		if (episode) {
			return colours[episode.seriesId] ?? defaultColours[episode.seriesId] ?? defaultColour;
		} else {
			return defaultColour;
		}
	}, [colours, episode]);
};
