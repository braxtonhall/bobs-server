import { ReactElement } from "react";
import { Box, FormControlLabel, Typography } from "@mui/material";

export const Labelled = ({
	height,
	value,
	valueLabel,
	label,
	children,
}: {
	height: string;
	value: unknown;
	valueLabel: string;
	label: string;
	children: ReactElement;
}) => (
	<FormControlLabel
		control={
			<Box height={height} alignItems="center" display="flex" flexDirection="column" justifyContent="center">
				{children}
			</Box>
		}
		label={<Typography variant="subtitle2">{value ? valueLabel : label}</Typography>}
		labelPlacement="bottom"
		value={value}
	/>
);
