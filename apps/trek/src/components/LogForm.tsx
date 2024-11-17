import {
	Button,
	Box,
	Checkbox,
	FormGroup,
	FormControlLabel,
	Rating,
	TextField,
	Typography,
	Stack,
	useMediaQuery,
} from "@mui/material";
import { Tags } from "./Tags";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Form } from "react-router-dom";
import { ReactElement, useCallback, useEffect, useState } from "react";
import {
	HistoryEduRounded,
	FavoriteBorderRounded,
	FavoriteRounded,
	ErrorRounded,
	RadioButtonUnchecked,
} from "@mui/icons-material";
import { DateTime } from "luxon";
import { API } from "../util/api";
import { Episode } from "./Watch/types";
import { SlidingRating } from "./misc/SlidingRating";

const getStoredTags = () => {
	try {
		const savedTags = JSON.parse(localStorage.getItem("tags") ?? "[]");
		if (Array.isArray(savedTags) && savedTags.every((element) => typeof element === "string")) {
			return savedTags;
		}
	} catch {
		// Do nothing
	}
	return [];
};

export const LogForm = (props: {
	episode: Episode;
	logEpisode: (opts: Parameters<API["logEpisode"]["mutate"]>[0]) => void;
}) => {
	const [tags, setTags] = useState(getStoredTags());
	const [date, setDate] = useState<DateTime | null>(DateTime.now());
	const [rating, setRating] = useState<number | null>(null);
	const [liked, setLiked] = useState(false);
	const [review, setReview] = useState("");
	const [spoiler, setSpoiler] = useState(false);
	const touchScreen = useMediaQuery("(pointer:coarse)");

	useEffect(() => {
		window.onbeforeunload = () => (review || rating || liked ? "Are you sure you want to exit?" : undefined);
		return () => void (window.onbeforeunload = null);
	}, [review, rating, liked]);

	const storeTags = useCallback((tags: string[]) => {
		localStorage.setItem("tags", JSON.stringify(tags));
		return setTags(tags);
	}, []);

	return (
		<Form
			onSubmit={(event) => {
				event.preventDefault();
				return props.logEpisode({
					episodeId: props.episode.id,
					viewedOn: date && date.toFormat("yyyy-MM-dd"),
					comment: review.trim() || null,
					rating: rating && rating * 2,
					tags,
					liked,
					spoiler,
				});
			}}
		>
			<FormGroup>
				<Stack direction={{ xs: "column", md: "row" }}>
					<Stack
						marginLeft={{ xs: "unset", md: "auto" }}
						direction={{ xs: "row", md: "column" }}
						justifyContent={{ xs: "center", md: "unset" }}
					>
						<Labelled height="45px" valueLabel="Rated" label="Rate" value={rating}>
							{touchScreen ? (
								<SlidingRating value={rating} onChange={setRating} precision={0.5} />
							) : (
								<Rating
									value={rating}
									precision={0.5}
									onChange={(_, rating) => setRating(rating)}
									size="large"
								/>
							)}
						</Labelled>

						<Labelled height="45px" valueLabel="Liked" label="Like" value={liked}>
							<Checkbox
								icon={<FavoriteBorderRounded />}
								checkedIcon={<FavoriteRounded />}
								onChange={(_, liked) => setLiked(liked)}
							/>
						</Labelled>
					</Stack>

					<Stack direction="column" sx={{ flex: "auto" }}>
						{/* TODO need to have a maximum length come from the platform */}
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
					</Stack>
				</Stack>
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					flexDirection={{ xs: "column", md: "row" }}
				>
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						flexDirection="row"
						width="100%"
						marginBottom={{ xs: "1em", md: "unset" }}
					>
						<Tags tags={tags} setTags={storeTags} />
					</Box>
					<Box display="flex" justifyContent="center" alignItems="center" width={{ xs: "100%", md: "unset" }}>
						<LocalizationProvider dateAdapter={AdapterLuxon}>
							<DatePicker
								slotProps={{ field: { clearable: true } }}
								label="Watch Date"
								value={date}
								onChange={setDate}
								sx={{
									marginLeft: { xs: "unset", md: "1em" },
									width: { xs: "100%", md: "200px" },
									marginRight: "1em",
								}}
							/>
						</LocalizationProvider>

						<Box marginLeft="auto">
							<Button type="submit" variant="contained">
								<HistoryEduRounded /> Save
							</Button>
						</Box>
					</Box>
				</Box>
			</FormGroup>
		</Form>
	);
};

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
