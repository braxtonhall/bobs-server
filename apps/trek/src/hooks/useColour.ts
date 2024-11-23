import { useUserContext } from "../contexts/UserContext";

const defaultColour = "#FFFFFF";

export const defaultColours: Record<string, string> = {
	TOS: "#fff2cc",
	TOSM: "#fff2cc",
	TAS: "#fce5cd",
	TNG: "#c9daf8",
	TNGM: "#c9daf8",
	DS9: "#d9d2e9",
	VOY: "#f4cccc",
	ENT: "#d9eAd3",
};

export const useColour = (episode?: { seriesId: string }): string => {
	const {
		settings: { colours },
	} = useUserContext();
	if (episode) {
		return colours[episode.seriesId] ?? defaultColours[episode.seriesId] ?? defaultColour;
	} else {
		return defaultColour;
	}
};
