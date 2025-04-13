import { Box, BoxProps } from "@mui/material";

export const SpaceFillingBoxContainer = (props: BoxProps) => (
	<Box width="100%" height="100%" position="relative">
		<Box height="100%" width="100%" display="flex" position="absolute" {...props}>
			{props.children}
		</Box>
	</Box>
);

export const SpaceFillingBox = (props: BoxProps) => (
	<Box display="flex" flex={1} minHeight="0px" {...props}>
		{props.children}
	</Box>
);
