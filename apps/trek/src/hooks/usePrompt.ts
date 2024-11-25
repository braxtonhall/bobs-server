import { useCallback, useRef, useEffect } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

export const usePrompt = (message: string) => {
	const blocker = useBlocker(useCallback(() => !window.confirm(message), [message]));
	const state = useRef(blocker.state);

	useEffect(() => {
		if (blocker.state === "blocked") {
			blocker.reset();
		}
		state.current = blocker.state;
	}, [blocker]);

	useBeforeUnload(
		useCallback(
			(event) => {
				event.preventDefault();
				event.returnValue = message;
			},
			[message],
		),
		{ capture: true },
	);
};
