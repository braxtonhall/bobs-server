import { useProfileContext } from "../contexts/ProfileContext";
import { useUserContext } from "../contexts/UserContext";
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
	FormControlLabel,
	FormGroup,
	Snackbar,
	SnackbarCloseReason,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { ReactNode, SyntheticEvent, useCallback, useState } from "react";
import { ExpandMoreRounded } from "@mui/icons-material";
import { Form } from "react-router-dom";

const SettingsSection = (props: { name: string; children?: ReactNode | ReactNode[]; defaultExpanded?: boolean }) => (
	<Accordion defaultExpanded={props.defaultExpanded} sx={{ boxShadow: "none" }}>
		<AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ paddingLeft: 0 }}>
			<Typography variant="h4">{props.name}</Typography>
		</AccordionSummary>
		<AccordionDetails sx={{ padding: 0 }}>{props.children}</AccordionDetails>
	</Accordion>
);

const Settings = () => {
	const { viewer, setSelf } = useProfileContext();
	const { settings, setSettings } = useUserContext();

	const [name, setName] = useState(viewer.name);

	const [alertOpen, setAlertOpen] = useState(false);

	const handleClose = useCallback(
		(_?: SyntheticEvent | Event, reason?: SnackbarCloseReason) => reason !== "clickaway" && setAlertOpen(false),
		[],
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
							setSelf?.({ name });
							setSettings({
								...spoilers,
								colours: {},
							});
							setAlertOpen(true);
						}}
					>
						<FormGroup>
							<Stack direction="column">
								<SettingsSection name="Me">
									<Stack direction="column">
										<TextField
											label="Name"
											value={name}
											onChange={(event) => setName(event.target.value)}
										/>
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
									<Stack direction="column">TODO: colours</Stack>
								</SettingsSection>
								<Button type="submit" variant="contained">
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
