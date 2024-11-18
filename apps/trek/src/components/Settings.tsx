import { useProfileContext } from "../contexts/ProfileContext";
import { useUserContext } from "../contexts/UserContext";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Checkbox,
	Container,
	Divider,
	FormControlLabel,
	FormGroup,
	Stack,
	styled,
	TextField,
	Typography,
} from "@mui/material";
import { ReactNode, useState } from "react";
import { ExpandMoreRounded } from "@mui/icons-material";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
	boxShadow: "none",
}));

const SettingsSection = (props: { name: string; children?: ReactNode | ReactNode[]; defaultExpanded?: boolean }) => (
	<StyledAccordion defaultExpanded={props.defaultExpanded}>
		<AccordionSummary expandIcon={<ExpandMoreRounded />} style={{ paddingLeft: 0 }}>
			<Typography variant="h4">{props.name}</Typography>
		</AccordionSummary>
		<AccordionDetails>{props.children}</AccordionDetails>
	</StyledAccordion>
);

const Settings = () => {
	const { viewer } = useProfileContext();
	const { settings } = useUserContext();

	const [name, setName] = useState(viewer.name);

	const settingsStates = {
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

	console.log(settingsStates);

	return (
		<Container maxWidth="md">
			<Box marginTop="1em">
				<Typography variant="h2">Settings</Typography>

				<FormGroup>
					<Stack direction="column">
						<SettingsSection name="Me" defaultExpanded>
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
								{Object.entries(settingsStates).map(
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
												<Checkbox onChange={(_, checked) => set(checked)} checked={value} />
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
						<Button>Save</Button>
					</Stack>
				</FormGroup>
			</Box>
		</Container>
	);
};

export default Settings;
