import { Box, Rating, Slider, styled } from "@mui/material";

const StyledRating = styled(Rating)(({ theme }) => ({
	"@media not (hover: none)": {
		"&:has(+.slider .Mui-focusVisible)": {
			outlineColor: theme.palette.action.focus,
			outlineWidth: "1px",
			outlineStyle: "solid",
		},
	},
	"@media (hover: none)": {
		"&:has(+.slider .Mui-active)": {
			outlineColor: theme.palette.action.focus,
			outlineWidth: "1px",
			outlineStyle: "solid",
		},
	},
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
	width: "100%",
	height: "100%",
	top: 0,
	left: 0,
	position: "absolute",
	padding: "0 !important",
	opacity: 0,
	"& .MuiSlider-thumb::after, & .MuiSlider-thumb": {
		height: "unset !important",
		width: "unset !important",
	},
}));

// TODO the slider and the rating are not lined up. FIX THIS!!!
// TODO support hovering!!!
export const SlidingRating = ({
	value,
	onChange,
	precision = 1,
}: {
	value: number | null;
	onChange: (value: number | null) => void;
	precision?: number;
}) => (
	<Box
		className="swiper-no-swiping"
		sx={{
			position: "relative",
			width: "fit-content",
			height: "fit-content",
		}}
		display="flex"
	>
		<StyledRating className="rating" value={value} precision={precision} size="large" readOnly />
		<StyledSlider
			className="slider"
			value={value || 0}
			step={precision}
			marks
			min={0}
			max={5}
			onChange={(_, value) => onChange(value === null ? null : Math.min(value as number, 5))}
			// TODO double click to unset is not supported
			onDoubleClick={() => onChange(null)}
		/>
	</Box>
);
