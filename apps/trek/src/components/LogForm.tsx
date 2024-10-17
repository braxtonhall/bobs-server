import { Button, Box, Checkbox, FormGroup, FormControlLabel, Rating, TextField } from "@mui/material";
import { Tags } from "./Tags";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Form } from "react-router-dom";
import { useState } from "react";
import { HistoryEduRounded, FavoriteBorderRounded, FavoriteRounded } from "@mui/icons-material";
import { DateTime } from "luxon";
import { API } from "../util/api";

type Viewing = Awaited<ReturnType<API["getCurrentlyWatching"]["query"]>>["viewings"][number];
type Episode = Viewing["watchlist"]["episodes"][number];

export const LogForm = (props: { episode: Episode; logEpisode: API["logEpisode"]["mutate"] }) => {
	const [tags, setTags] = useState<string[]>([]);
	const [date, setDate] = useState<DateTime | null>(DateTime.now());
	const [rating, setRating] = useState<number | null>(null);
	const [liked, setLiked] = useState(false);
	const [review, setReview] = useState("");
	const [spoiler, setSpoiler] = useState(false);

	return (
		<>
			<Box bgcolor="#ffffffbd">
				<Form
					onSubmit={(event) => {
						event.preventDefault();
						return props.logEpisode({
							episodeId: props.episode.id,
							viewedOn: date && date.toFormat("yyyy-MM-dd"),
							comment: review.trim() || null,
							tags,
							liked,
							rating,
							spoiler,
						});
					}}
				>
					<FormGroup>
						<FormControlLabel
							control={
								<Checkbox
									icon={<FavoriteBorderRounded />}
									checkedIcon={<FavoriteRounded />}
									onChange={(_, liked) => setLiked(liked)}
								/>
							}
							label="Liked"
							labelPlacement="bottom"
							value={liked}
						/>
						<FormControlLabel
							control={
								<Rating value={rating} precision={0.5} onChange={(_, rating) => setRating(rating)} />
							}
							label="Rating"
							labelPlacement="bottom"
						/>
						<FormControlLabel
							control={
								<LocalizationProvider dateAdapter={AdapterLuxon}>
									<DatePicker label="Watched on" value={date} onChange={setDate} />
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
									value={review}
									onChange={(event) => setReview(event.target.value)}
								/>
							}
							label="Review"
							labelPlacement="bottom"
						/>
						<FormControlLabel
							control={<Checkbox onChange={(_, spoiler) => setSpoiler(spoiler)} />}
							label="Spoiler"
							labelPlacement="bottom"
							value={spoiler}
							disabled={!review}
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
