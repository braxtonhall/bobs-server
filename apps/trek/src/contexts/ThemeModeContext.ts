import { ThemeMode } from "../util/themeMode";
import { createContext } from "react";

type ThemeModeContextContent = {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
};

export const ThemeModeContext = createContext<ThemeModeContextContent | null>(null);
