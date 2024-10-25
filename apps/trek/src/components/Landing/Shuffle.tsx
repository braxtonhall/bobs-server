import { useState } from "react";
import { Box, Rating, Slider, useTheme } from "@mui/material";
import { SlidingRating } from "../misc/SlidingRating";

const Shuffle = () => {
	const [ratingA, setRatingA] = useState<number>(0);
	const [ratingB, setRatingB] = useState<number | null>(null);
	const [ratingC, setRatingC] = useState<number>(0);

	return (
		<>
			<p>This is where the shuffling goes</p>

			<Rating value={ratingA} precision={0.5} onChange={(_, rating) => setRatingA(rating ?? 0)} size="large" />
			<SlidingRating value={ratingB} onChange={setRatingB} precision={0.5} />

			<Slider
				value={ratingC}
				step={0.5}
				marks
				min={0}
				max={5}
				onChange={(_, value) => setRatingC(value as number)}
				onBlur={console.log}
			/>
		</>
	);
};

export default Shuffle;
