import { Box, LinearProgress, Typography } from "@mui/material";

export const Progress = (props: { numerator: number; denominator: number }) => {
	const value = (props.numerator / props.denominator) * 100;
	return (
		<Box display="flex" alignItems="center">
			<Box sx={{ width: "100%", mr: 1 }}>
				<LinearProgress variant="determinate" value={value} />
			</Box>
			<Box sx={{ minWidth: 35 }}>
				<Typography variant="body2" sx={{ color: "text.secondary" }}>{`${Math.round(value)}%`}</Typography>
			</Box>
		</Box>
	);
};
