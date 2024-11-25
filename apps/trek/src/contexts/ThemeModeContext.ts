import { ThemeMode } from "../util/themeMode";
import { createContext } from "react";

type ThemeModeContextContent = {
	mode: ThemeMode;
	set: (mode: ThemeMode) => void;
	save: () => void;
};

export const ThemeModeContext = createContext<ThemeModeContextContent | null>(null);
