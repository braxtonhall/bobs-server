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
	Radio,
	RadioGroup,
	Select,
	Snackbar,
	SnackbarCloseReason,
	Stack,
	styled,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { ReactNode, SyntheticEvent, useCallback, useMemo, useState } from "react";
import { AddCircleRounded, RemoveCircleRounded, ExpandMoreRounded } from "@mui/icons-material";
import { Form } from "react-router-dom";
import { useContent } from "../hooks/useContent";
import { defaultColours } from "../hooks/useColour";
import { useExitConfirmation } from "../hooks/useExitConfirmation";
import { useSafeContext } from "../hooks/useSafeContext";
import { ThemeModeContext } from "../contexts/ThemeModeContext";
import { ThemeMode } from "../util/themeMode";

const SettingsSection = (props: { name: string; children?: ReactNode | ReactNode[]; defaultExpanded?: boolean }) => (
	<Accordion defaultExpanded={props.defaultExpanded} sx={{ boxShadow: "none" }}>
		<AccordionSummary expandIcon={<ExpandMoreRounded />}>
			<Typography variant="h4">{props.name}</Typography>
		</AccordionSummary>
		<AccordionDetails>{props.children}</AccordionDetails>
	</Accordion>
);

type ColourSettingTransport = { series: string | null; colour: string | null };

const ColourInput = styled(MuiColorInput)(() => ({
	"& input": { display: "none" },
	"& > div": { flex: 1, padding: "14px" },
	"& div": { margin: 0 },
	"& button": { backgroundImage: "unset !important" },
	"& div:has(> button)": {
		"background-color": "white",
		"background-image":
			"linear-gradient(45deg, #ccc 26%, transparent 26%), linear-gradient(135deg, #ccc 26%, transparent 26%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(135deg, transparent 75%, #ccc 75%)",
		"background-size": "6px 6px",
		"background-position": "0 0, 3px 0, 3px -3px, 0px 3px",
		"border-radius": "4px",
	},
	display: "flex",
	flex: 1,
}));

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
			<Box display="flex" flexDirection="column" marginRight="1em">
				<ColourInput
					format="hex8"
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

// TODO
//  1. Delete account
//  2. Export (imdb format?)
//  3. Import
export const Settings = () => {
	const { viewer, setSelf } = useProfileContext();
	const { settings, setSettings } = useUserContext();
	const { mode, setMode } = useSafeContext(ThemeModeContext);
	const theme = useTheme();

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

	useExitConfirmation({ block: changed });

	return (
		<>
			<Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleClose}>
				<Alert onClose={handleClose} severity="success" variant="filled" sx={{ width: "100%" }}>
					Saved!
				</Alert>
			</Snackbar>
			<Container maxWidth="md">
				<Box marginTop="1em" marginBottom="1em">
					<Typography variant="h2" color={theme.palette.text.primary}>
						Settings
					</Typography>
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
										<Box width="100%" marginBottom="1em">
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

										<Box width="100%" display="flex" justifyContent="right" alignItems="center">
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

								<Divider />

								<SettingsSection name="Theme">
									<FormControl fullWidth>
										<Box width="100%" display="flex">
											<RadioGroup
												defaultValue={mode}
												onChange={(_, value) => setMode(value as ThemeMode)}
											>
												<FormControlLabel
													value={ThemeMode.Light}
													control={<Radio />}
													label="Light"
												/>
												<FormControlLabel
													value={ThemeMode.Dark}
													control={<Radio />}
													label="Dark"
												/>
												<FormControlLabel
													value={ThemeMode.System}
													control={<Radio />}
													label="System"
												/>
											</RadioGroup>
										</Box>
									</FormControl>
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
