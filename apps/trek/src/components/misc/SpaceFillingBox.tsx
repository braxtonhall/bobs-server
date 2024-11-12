import { Box, BoxProps } from "@mui/material";

export const SpaceFillingBox = (props: BoxProps) => (
	<Box width="100%" height="100%" position="relative">
		<Box height="100%" width="100%" display="flex" position="absolute" {...props}>
			{props.children}
		</Box>
	</Box>
);
