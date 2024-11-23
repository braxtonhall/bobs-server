import { useRef } from "react";
import { Box, BoxProps } from "@mui/material";
import { useOnScreen } from "../../hooks/useOnScreen";

type OnScreenWatcherProps = BoxProps & { onScreen: () => void };

export const OnScreenWatcher = ({ onScreen, children, ...props }: OnScreenWatcherProps) => {
	const watcherRef = useRef<HTMLElement>(null);
	useOnScreen(watcherRef, (isIntersecting) => isIntersecting && onScreen());
	return (
		<Box {...props} ref={watcherRef}>
			{children}
		</Box>
	);
};
