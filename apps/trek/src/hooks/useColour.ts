import { useUserContext } from "../contexts/UserContext";

const defaultColour = "#FFFFFF";

const defaults: Record<string, string> = {
	TOS: "#FFF2CC",
	TOSM: "#FFF2CC",
	TAS: "#FCE5CD",
	TNG: "#C9DAF8",
	TNGM: "#C9DAF8",
	DS9: "#D9D2E9",
	VOY: "#F4CCCC",
	ENT: "#D9EAD3",
};

export const useColour = (episode?: { seriesId: string }): string => {
	const {
		settings: { colours },
	} = useUserContext();
	if (episode) {
		return colours[episode.seriesId] ?? defaults[episode.seriesId] ?? defaultColour;
	} else {
		return defaultColour;
	}
};
