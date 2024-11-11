import {
	Button,
	Box,
	Checkbox,
	FormGroup,
	FormControlLabel,
	Rating,
	TextField,
	Typography,
	Card,
	CardMedia,
	Stack,
	useMediaQuery,
} from "@mui/material";
import { Tags } from "./Tags";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Form, Link } from "react-router-dom";
import { ReactElement, useCallback, useState } from "react";
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

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

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

export const LogForm = (props: { episode: Episode; logEpisode: API["logEpisode"]["mutate"] }) => {
	const [tags, setTags] = useState(getStoredTags());
	const [date, setDate] = useState<DateTime | null>(DateTime.now());
	const [rating, setRating] = useState<number | null>(null);
	const [liked, setLiked] = useState(false);
	const [review, setReview] = useState("");
	const [spoiler, setSpoiler] = useState(false);
	const touchScreen = useMediaQuery("(hover: none)");

	const storeTags = useCallback((tags: string[]) => {
		localStorage.setItem("tags", JSON.stringify(tags));
		return setTags(tags);
	}, []);

	return (
		<Card style={{ backgroundColor: "antiquewhite", padding: "1em", boxShadow: "none" }}>
			<Box display="flex" alignItems="stretch" position="relative" marginBottom="1em">
				<Card style={{ width: "4em", marginRight: "0.5em", minWidth: "50px", position: "relative" }}>
					<Link
						to={`/shows/${props.episode.seriesId.toLowerCase()}/seasons/${props.episode.season}/episodes/${props.episode.production}`}
					>
						<CardMedia
							alt={props.episode.name}
							image={IMG_URL}
							component="img"
							sx={{ position: "absolute", top: 0, right: 0, height: "100%", width: "100%" }}
						/>
					</Link>
				</Card>

				<Box sx={{ display: { xs: "unset", sm: "table-cell" }, width: { xs: "unset", sm: "100%" } }}>
					{/*TODO it would be nice if this font changed based on the show https://github.com/wrstone/fonts-startrek*/}
					<Typography variant="h5" component="h2">
						{props.episode.name}
					</Typography>

					<Typography variant="body2" component="p">
						{props.episode.abbreviation ?? props.episode.seriesId}
						{props.episode.abbreviation === null
							? ` Season ${props.episode.season}, Episode ${props.episode.production}`
							: ""}
					</Typography>

					<Typography sx={{ fontSize: 14 }}>{props.episode.release}</Typography>
				</Box>
			</Box>

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
					<Stack direction={{ xs: "column", sm: "row" }}>
						<Stack
							marginLeft={{ xs: "unset", sm: "auto" }}
							direction={{ xs: "row", sm: "column" }}
							justifyContent={{ xs: "center", sm: "unset" }}
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
						flexDirection={{ xs: "column", sm: "row" }}
					>
						<Box
							display="flex"
							justifyContent="center"
							alignItems="center"
							flexDirection="row"
							width="100%"
							marginBottom={{ xs: "1em", sm: "unset" }}
						>
							<Tags tags={tags} setTags={storeTags} />
						</Box>
						<Box
							display="flex"
							justifyContent="center"
							alignItems="center"
							width={{ xs: "100%", sm: "unset" }}
						>
							<LocalizationProvider dateAdapter={AdapterLuxon}>
								<DatePicker
									slotProps={{ field: { clearable: true } }}
									label="Watch Date"
									value={date}
									onChange={setDate}
									sx={{
										marginLeft: { xs: "unset", sm: "1em" },
										width: { xs: "100%", sm: "200px" },
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
		</Card>
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
