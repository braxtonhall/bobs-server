import { createContext } from "react";

export const MobileContext = createContext<{
	smallScreen: boolean;
	touchScreen: boolean;
}>({ smallScreen: false, touchScreen: false });
