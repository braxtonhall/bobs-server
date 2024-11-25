import { createContext } from "react";

type ViewingControls = {
	pause: () => void;
	stop: () => void;
	resume: () => void;
	complete: () => void;
};

export const ViewingControlsContext = createContext<ViewingControls | null>(null);
