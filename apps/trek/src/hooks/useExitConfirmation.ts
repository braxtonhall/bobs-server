import { useBeforeUnload, useBlocker } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";

const defaultMessage = "Are you sure you want to exit?";

export const useExitConfirmation = ({
	block,
	message = defaultMessage,
}: {
	block: unknown;
	message?: string;
}): void => {
	const shouldBlock = useCallback(() => (block ? !window.confirm(message) : false), [message, block]);
	const blocker = useBlocker(shouldBlock);
	const state = useRef(blocker.state);
	const beforeUnload = useCallback(
		(event: BeforeUnloadEvent) => {
			if (block) {
				event.preventDefault();
				event.returnValue = message;
			}
		},
		[message, block],
	);
	useEffect(() => {
		if (blocker.state === "blocked") {
			blocker.reset();
		}
		state.current = blocker.state;
	}, [blocker]);
	useBeforeUnload(beforeUnload, { capture: true });
};
