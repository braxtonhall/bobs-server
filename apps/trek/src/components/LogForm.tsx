import { Button, Box, Checkbox, FormGroup, FormControlLabel, Rating, TextField, Typography } from "@mui/material";
import { Tags } from "./Tags";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Form } from "react-router-dom";
import { ReactElement, useState } from "react";
import {
	HistoryEduRounded,
	FavoriteBorderRounded,
	FavoriteRounded,
	ErrorRounded,
	RadioButtonUnchecked,
} from "@mui/icons-material";
import { DateTime } from "luxon";
import { API } from "../util/api";

type Viewing = Awaited<ReturnType<API["getCurrentlyWatching"]["query"]>>["viewings"][number];
type Episode = Viewing["watchlist"]["episodes"][number];

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
	<Box height={height} alignItems="center" display="flex" flexDirection="column" justifyContent="center">
		<FormControlLabel
			control={children}
			label={<Typography variant="subtitle2">{value ? valueLabel : label}</Typography>}
			labelPlacement="bottom"
			value={value}
		/>
	</Box>
);

export const LogForm = (props: { episode: Episode; logEpisode: API["logEpisode"]["mutate"]; mobile: boolean }) => {
	const [tags, setTags] = useState<string[]>([]);
	const [date, setDate] = useState<DateTime | null>(DateTime.now());
	const [rating, setRating] = useState<number | null>(null);
	const [liked, setLiked] = useState(false);
	const [review, setReview] = useState("");
	const [spoiler, setSpoiler] = useState(false);

	return (
		<>
			<Box>
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
						<Box display="flex" sx={props.mobile ? { flexDirection: "column" } : {}}>
							<Box sx={{ flex: "auto", display: "flex", flexDirection: "column" }}>
								<TextField
									label="Review"
									multiline
									value={review}
									onChange={(event) => setReview(event.target.value)}
									minRows={4}
								/>
								<FormControlLabel
									control={
										<Checkbox
											icon={<RadioButtonUnchecked />}
											checkedIcon={<ErrorRounded />}
											onChange={(_, spoiler) => setSpoiler(spoiler)}
										/>
									}
									label="Review contains spoilers"
									labelPlacement="end"
									value={spoiler}
									disabled={!review}
								/>
							</Box>

							<Box
								display="flex"
								marginLeft={props.mobile ? "unset" : "auto"}
								flexDirection={props.mobile ? "row" : "column"}
								justifyContent="center"
								alignItems="center"
							>
								<Labelled height="45px" valueLabel="Rated" label="Rate" value={rating}>
									<Rating
										value={rating}
										precision={0.5}
										onChange={(_, rating) => setRating(rating)}
										size="large"
									/>
								</Labelled>

								<Labelled height="45px" valueLabel="Liked" label="Like" value={liked}>
									<Checkbox
										icon={<FavoriteBorderRounded />}
										checkedIcon={<FavoriteRounded />}
										onChange={(_, liked) => setLiked(liked)}
									/>
								</Labelled>
							</Box>
						</Box>
						<Box display="flex" justifyContent="center" alignItems="center">
							<Tags tags={tags} setTags={setTags} />

							<LocalizationProvider dateAdapter={AdapterLuxon}>
								<DatePicker
									slotProps={{ field: { clearable: true } }}
									label="Watch Date"
									value={date}
									onChange={setDate}
									sx={{ marginLeft: "1em", width: "350px" }}
								/>
							</LocalizationProvider>

							<Box marginLeft="1em">
								<Button type="submit" variant="contained">
									<HistoryEduRounded /> Save
								</Button>
							</Box>
						</Box>
					</FormGroup>
				</Form>
			</Box>
		</>
	);
};
