import { ThemeMode } from "../util/themeMode.js";
import { useMediaQuery } from "@mui/material";
import { darkTheme, lightTheme } from "../themes.js";

export const useThemeMode = (mode: ThemeMode) => {
	const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
	switch (mode) {
		case ThemeMode.Dark:
			return darkTheme;
		case ThemeMode.Light:
			return lightTheme;
		case ThemeMode.System:
			return systemPrefersDark ? darkTheme : lightTheme;
		default:
			return mode satisfies never;
	}
};
