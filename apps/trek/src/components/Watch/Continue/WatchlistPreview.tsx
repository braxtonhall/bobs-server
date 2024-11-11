import { Viewings } from "../types";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { ExpandMoreRounded } from "@mui/icons-material";
import { Progress } from "../../misc/Progress";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { API } from "../../../util/api";

export const WatchlistPreview = ({
	viewing,
	index,
	setCursor,
}: {
	viewing: DecoratedViewing;
	index: number;
	setCursor: API["updateCursor"]["mutate"];
}) => {
	const desktop = useMediaQuery(useTheme().breakpoints.up("sm"));
	return desktop ? (
		<Box height="100%" width="100%" position="relative">
			<Box padding="0.5em" height="100%" width="100%" display="flex" position="absolute" flexDirection="column">
				<WatchlistPreviewHeader viewing={viewing} index={index} />
				<Box display="flex" flex={1} minHeight="0px">
					<WatchlistPreviewContent viewing={viewing} index={index} setCursor={setCursor} />
				</Box>
			</Box>
		</Box>
	) : (
		<Accordion style={{ boxShadow: "none" }}>
			<AccordionSummary expandIcon={<ExpandMoreRounded />} style={{ paddingLeft: 0, paddingRight: 0 }}>
				<WatchlistPreviewHeader viewing={viewing} index={index} />
			</AccordionSummary>
			<AccordionDetails style={{ paddingLeft: 0, paddingRight: 0 }}>
				<WatchlistPreviewContent viewing={viewing} index={index} setCursor={setCursor} />
			</AccordionDetails>
		</Accordion>
	);
};

const WatchlistPreviewHeader = ({ viewing, index }: { viewing: Viewings[number]; index: number }) => (
	<Box width="100%">
		<Box display="flex" alignItems="center">
			<Typography variant="h4">{viewing.watchlist.name}</Typography>
		</Box>
		<Progress
			numerator={index < 0 ? viewing.watchlist.episodes.length : index}
			denominator={viewing.watchlist.episodes.length}
		/>
	</Box>
);

const WatchlistPreviewContent = ({
	viewing,
	index: cursorIndex,
	setCursor,
}: {
	viewing: DecoratedViewing;
	index: number;
	setCursor: API["updateCursor"]["mutate"];
}) => (
	<Box flex={1} overflow="auto" width="100%" maxHeight="500px">
		<Box>
			<nav>
				<List>
					{viewing.watchlist.episodes.map((episode, episodeIndex) => (
						<ListItem disablePadding key={episode.id}>
							<ListItemButton
								onClick={() => setCursor({ viewingId: viewing.id, episodeId: episode.id })}
								selected={cursorIndex === episodeIndex}
							>
								<ListItemText primary={episode.name} />
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</nav>
		</Box>
	</Box>
);
