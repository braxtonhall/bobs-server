import type { CurrentlyWatching, logEpisode } from "../util/api";
import { Button, Box, Checkbox, FormGroup, FormControlLabel, Rating, TextField } from "@mui/material";
import { Tags } from "./Tags";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Form } from "react-router-dom";
import { useState } from "react";
import { HistoryEduRounded } from "@mui/icons-material";
import { DateTime } from "luxon";

type Episode = NonNullable<CurrentlyWatching["watching"]>["episodes"][number];

export const LogForm = (props: { episode: Episode; logEpisode: typeof logEpisode }) => {
	const [tags, setTags] = useState<string[]>([]);
	const [date, setDate] = useState<DateTime | null>(null);
	const [rating, setRating] = useState<number | null>(null);
	const [liked, setLiked] = useState(false);
	const [review, setReview] = useState("");

	return (
		<>
			<Box>
				<Form
					onSubmit={(event) => {
						event.preventDefault();
						return props.logEpisode({
							episodeId: props.episode.id,
							tags,
							viewedOn: date && Date.UTC(Number(date.year), Number(date.month) - 1, Number(date.day)),
							liked,
							rating,
							comment: review || null,
						});
					}}
				>
					<FormGroup>
						<FormControlLabel
							control={<Checkbox name="liked" onChange={(_, liked) => setLiked(liked)} />}
							label="Liked"
							labelPlacement="bottom"
							value={liked}
						/>
						<FormControlLabel
							control={
								<Rating
									name="rating"
									value={rating}
									precision={0.5}
									onChange={(_, rating) => setRating(rating)}
								/>
							}
							label="Rating"
							labelPlacement="bottom"
						/>
						<FormControlLabel
							control={
								<LocalizationProvider dateAdapter={AdapterLuxon}>
									<DatePicker label="Watched on" name="date" value={date} onChange={setDate} />
								</LocalizationProvider>
							}
							label="Date"
							labelPlacement="bottom"
						/>
						<FormControlLabel
							control={
								<TextField
									label="Review"
									multiline
									name="review"
									value={review}
									onChange={(event) => setReview(event.target.value)}
								/>
							}
							label="Review"
							labelPlacement="bottom"
						/>
						<FormControlLabel
							control={<Tags tags={tags} setTags={setTags} />}
							label="Tags"
							labelPlacement="bottom"
						/>
						<Button type="submit">
							<HistoryEduRounded />
						</Button>
					</FormGroup>
				</Form>
			</Box>
		</>
	);
};
