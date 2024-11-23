import { useProfileContext } from "../contexts/ProfileContext";
import { useUserContext } from "../contexts/UserContext";
import { MuiColorInput } from "mui-color-input";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Checkbox,
	Container,
	Divider,
	FormControl,
	FormControlLabel,
	FormGroup,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Snackbar,
	SnackbarCloseReason,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { ReactNode, SyntheticEvent, useCallback, useMemo, useState } from "react";
import { AddCircleRounded, RemoveCircleRounded, ExpandMoreRounded } from "@mui/icons-material";
import { Form } from "react-router-dom";
import { useContent } from "../util/useContent";
import { defaultColours } from "../hooks/useColour";

const SettingsSection = (props: { name: string; children?: ReactNode | ReactNode[]; defaultExpanded?: boolean }) => (
	<Accordion defaultExpanded={props.defaultExpanded} sx={{ boxShadow: "none" }}>
		<AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ paddingLeft: 0 }}>
			<Typography variant="h4">{props.name}</Typography>
		</AccordionSummary>
		<AccordionDetails sx={{ padding: 0 }}>{props.children}</AccordionDetails>
	</Accordion>
);

type ColourSettingTransport = { series: string | null; colour: string | null };

const ColourSetting = ({
	setting,
	index,
	setColours,
	series,
}: {
	setting: ColourSettingTransport;
	index: number;
	setColours: (callback: (colours: ColourSettingTransport[]) => ColourSettingTransport[]) => void;
	series: { name: string; id: string }[];
}) => {
	return (
		<Box width="100%" display="flex" marginBottom="1em">
			<Box flex={1} marginRight="1em">
				<FormControl fullWidth>
					<InputLabel id={`colour-series-${index}`}>Series</InputLabel>
					<Select
						variant="outlined"
						labelId={`colour-series-${index}`}
						value={setting.series ?? ""}
						label="Series"
						onChange={(event) =>
							setColours((colours) => {
								const series = event.target.value;
								colours[index].series = series;
								colours[index].colour ??= defaultColours[series];
								return [...colours];
							})
						}
					>
						{series.map(({ name, id }) => (
							<MenuItem key={id} value={id}>
								{name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
			<Box width="125px" marginRight="1em">
				<MuiColorInput
					format="hex"
					value={setting.colour ?? ""}
					onChange={(colour) =>
						setColours((colours) => {
							colours[index].colour = colour;
							return [...colours];
						})
					}
				/>
			</Box>
			<Box width="fit-content" display="flex" justifyContent="center" alignItems="center">
				<IconButton
					aria-label="remove"
					onClick={() =>
						setColours((colours) => {
							colours.splice(index, 1);
							return [...colours];
						})
					}
				>
					<RemoveCircleRounded />
				</IconButton>
			</Box>
		</Box>
	);
};

const Settings = () => {
	const { viewer, setSelf } = useProfileContext();
	const { settings, setSettings } = useUserContext();

	const [name, setName] = useState(viewer.name);
	const [about, setAbout] = useState(viewer.about);

	const [alertOpen, setAlertOpen] = useState(false);

	const { series } = useContent();

	const seriesAndNames = useMemo(() => Object.values(series ?? {}), [series]);

	const handleClose = useCallback(
		(_?: SyntheticEvent | Event, reason?: SnackbarCloseReason) => reason !== "clickaway" && setAlertOpen(false),
		[],
	);

	const [colours, setColours] = useState<ColourSettingTransport[]>(
		Object.entries(settings.colours).map(([key, value]) => ({ series: key, colour: value })),
	);

	const newColours = useMemo(
		() => Object.fromEntries(colours.map((setting) => [setting.series, setting.colour])),
		[colours],
	);

	const spoilersStates = {
		isSpoilerEpisodeName: {
			name: "Episode Name",
			state: useState(settings.isSpoilerEpisodeName),
		},
		isSpoilerEpisodePicture: {
			name: "Episode Picture",
			state: useState(settings.isSpoilerEpisodePicture),
		},
		isSpoilerEpisodeDescription: {
			name: "Episode Description",
			state: useState(settings.isSpoilerEpisodeDescription),
		},
		isSpoilerEpisodeReviewComment: {
			name: "Episode Review",
			state: useState(settings.isSpoilerEpisodeReviewComment),
		},
		isSpoilerEpisodeReviewScore: {
			name: "Episode Review Score",
			state: useState(settings.isSpoilerEpisodeReviewScore),
		},
		isSpoilerEpisodeReviewCommentSpoilerTag: {
			name: "Episode Review Marked as Spoiler",
			state: useState(settings.isSpoilerEpisodeReviewCommentSpoilerTag),
		},
		isSpoilerEpisodeRating: {
			name: "Episode Rating",
			state: useState(settings.isSpoilerEpisodeRating),
		},
	} as const;

	const coloursUpdated = useMemo(
		() => JSON.stringify(newColours) !== JSON.stringify(settings.colours),
		[newColours, settings],
	);

	const changed =
		coloursUpdated ||
		viewer.name !== name ||
		viewer.about !== about ||
		Object.entries(spoilersStates).some(
			([
				key,
				{
					state: [value],
				},
			]) => value !== settings[key as keyof typeof spoilersStates],
		);

	const complete = useMemo(
		() => !!name && colours.every((setting) => !!setting.series && !!setting.colour),
		[name, colours],
	);

	return (
		<>
			<Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleClose}>
				<Alert onClose={handleClose} severity="success" variant="filled" sx={{ width: "100%" }}>
					Saved!
				</Alert>
			</Snackbar>
			<Container maxWidth="md">
				<Box marginTop="1em" marginBottom="1em">
					<Typography variant="h2">Settings</Typography>
					<Form
						onSubmit={(event) => {
							event.preventDefault();
							const spoilers = Object.fromEntries(
								Object.entries(spoilersStates).map(
									([
										key,
										{
											state: [value],
										},
									]) => [key, value],
								),
							) as Record<keyof typeof spoilersStates, boolean>;
							setSelf?.({ name, about });
							setSettings({
								...spoilers,
								colours: newColours,
							});
							setAlertOpen(true);
						}}
					>
						<FormGroup>
							<Stack direction="column">
								<SettingsSection name="Me">
									<Stack direction="column">
										<Box width="100%" marginBottom="1em">
											<TextField
												label="Name"
												value={name}
												onChange={(event) => setName(event.target.value)}
												autoComplete="off"
												fullWidth
											/>
										</Box>
										<Box width="100%">
											<TextField
												label="About"
												value={about}
												onChange={(event) => setAbout(event.target.value)}
												autoComplete="off"
												fullWidth
											/>
										</Box>
										<Box>TODO: favourites</Box>
									</Stack>
								</SettingsSection>

								<Divider />

								<SettingsSection name="Spoilers">
									<Stack direction="column">
										{Object.entries(spoilersStates).map(
											([
												key,
												{
													name,
													state: [value, set],
												},
											]) => (
												<FormControlLabel
													key={key}
													control={
														<Checkbox
															onChange={(_, checked) => set(checked)}
															checked={value}
														/>
													}
													label={name}
													value={value}
												/>
											),
										)}
									</Stack>
								</SettingsSection>

								<Divider />

								<SettingsSection name="Colours">
									<Stack direction="column">
										{colours.map((setting, index) => (
											<ColourSetting
												key={index}
												setColours={setColours}
												setting={setting}
												series={seriesAndNames}
												index={index}
											/>
										))}

										<Box
											width="100%"
											display="flex"
											justifyContent="right"
											alignItems="center"
											marginBottom="1em"
										>
											<IconButton
												color="primary"
												aria-label="add"
												onClick={() =>
													setColours((colours) => [
														...colours,
														{ colour: null, series: null },
													])
												}
											>
												<AddCircleRounded />
											</IconButton>
										</Box>
									</Stack>
								</SettingsSection>
								<Button type="submit" variant="contained" disabled={!(changed && complete)}>
									Save
								</Button>
							</Stack>
						</FormGroup>
					</Form>
				</Box>
			</Container>
		</>
	);
};

export default Settings;
