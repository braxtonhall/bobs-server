import { StarRounded, StarHalfRounded } from "@mui/icons-material";
import { Box, BoxProps, Typography, useTheme } from "@mui/material";
import { useState } from "react";

const toHumanNumber = (number: number): string => {
	if (number < 1000) {
		return String(number);
	} else if (number < 100_000) {
		return `${Math.round(number / 100) / 10}k`;
	} else {
		return `${Math.round(number / 100_000) / 10}m`;
	}
};

const toAverage = (average: number | null) => {
	if (average === null) {
		return null;
	} else {
		return Math.round(average * 2) / 2;
	}
};

(window as any).toHumanNumber = toHumanNumber;

type RatingHistogramProps = BoxProps & {
	counts: [number, number, number, number, number, number, number, number, number, number];
};

const Bar = ({
	value,
	max,
	rating,
	setHovering,
}: {
	max: number;
	value: number;
	rating: number;
	setHovering: (hovering: number | null) => void;
}) => {
	const theme = useTheme();
	return (
		<Box
			width="10%"
			height="100%"
			display="flex"
			sx={{
				"&:hover > *": {
					backgroundColor: theme.palette.info.dark,
				},
			}}
			onMouseOver={() => setHovering(rating)}
			onMouseOut={() => setHovering(null)}
		>
			<Box
				bgcolor={theme.palette.info.main}
				width="100%"
				marginTop="auto"
				marginLeft="0.1em"
				marginRight="0.1em"
				height={`${(value / max) * 100}%`}
			/>
		</Box>
	);
};

const Star = (props: { index: number; rating: number }) => {
	const starAtIndex = props.rating / 2 - props.index;
	if (starAtIndex >= 1) {
		return <StarRounded />;
	} else if (starAtIndex > 0) {
		return <StarHalfRounded />;
	} else {
		return <StarRounded sx={{ opacity: 0 }} />;
	}
};

const Stars = (props: { rating: number }) => (
	<Box>
		<Star rating={props.rating} index={0} />
		<Star rating={props.rating} index={1} />
		<Star rating={props.rating} index={2} />
		<Star rating={props.rating} index={3} />
		<Star rating={props.rating} index={4} />
	</Box>
);

export const RatingHistogram = ({ counts, ...props }: RatingHistogramProps) => {
	// TODO this just does NOT work on mobile. Make this work on mobile!!!
	const [hovering, setHovering] = useState<number | null>(null);
	const max = Math.max(...counts);
	const total = counts.reduce((a, b) => a + b);
	const average =
		total === 0 ? null : counts.reduce((sum, count, index) => sum + count * ((index + 1) / 2), 0) / total;

	return (
		<Box {...props}>
			<Box display="flex" width="100%" height="100%">
				<Box marginTop="auto" sx={hovering === null ? {} : { opacity: 0 }}>
					<StarRounded />
				</Box>
				<Box display="flex" flex="1" height="100%">
					{counts.map((count, index) => (
						<Bar value={count} max={max} key={index} rating={index} setHovering={setHovering} />
					))}
				</Box>
				<Box display="flex" height="100%" position="relative">
					<Typography
						variant="h3"
						position="absolute"
						sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
					>
						{hovering ? toHumanNumber(counts[hovering]) : toAverage(average)}
					</Typography>
					<Box marginTop="auto">
						<Stars rating={hovering === null ? 10 : hovering + 1} />
					</Box>
				</Box>
			</Box>
		</Box>
	);
};
