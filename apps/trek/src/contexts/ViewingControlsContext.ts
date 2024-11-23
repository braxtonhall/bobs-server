import { createContext, useContext } from "react";

type ViewingControls = {
	pause: () => void;
	stop: () => void;
	resume: () => void;
	complete: () => void;
};

export const ViewingControlsContext = createContext<ViewingControls | null>(null);

export const useViewingControls = () => {
	const controls = useContext(ViewingControlsContext);
	if (controls === null) {
		throw new Error("Viewing controls were not set!");
	} else {
		return controls;
	}
};
