import { Viewings } from "../types";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	MenuItem,
	styled,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { ExpandMoreRounded, PauseRounded, StopRounded } from "@mui/icons-material";
import { Progress } from "../../misc/Progress";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { MutableRefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { SpaceFillingBox, SpaceFillingBoxContainer } from "../../misc/SpaceFillingBox";
import { useUserContext } from "../../../contexts/UserContext";
import { useMutationContext } from "./MutationContext";
import { useColour } from "../../../hooks/useColour";
import { Options } from "../../misc/Options";
import { useViewingControls } from "../../../contexts/ViewingControlsContext";
import { useVirtualizer } from "@tanstack/react-virtual";

export const WatchlistPreview = ({ viewing, index }: { viewing: DecoratedViewing; index: number }) =>
	useMediaQuery(useTheme().breakpoints.up("sm")) ? (
		<SpaceFillingBoxContainer flexDirection="column">
			<WatchlistPreviewHeader viewing={viewing} index={index} />
			<SpaceFillingBox>
				<WatchlistPreviewContent viewing={viewing} index={index} />
			</SpaceFillingBox>
		</SpaceFillingBoxContainer>
	) : (
		<Accordion sx={{ boxShadow: "none" }}>
			<AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ paddingLeft: 0 }}>
				<WatchlistPreviewHeader viewing={viewing} index={index} />
			</AccordionSummary>
			<AccordionDetails sx={{ padding: 0 }}>
				<WatchlistPreviewContent viewing={viewing} index={index} />
			</AccordionDetails>
		</Accordion>
	);

const WatchlistPreviewHeader = ({ viewing, index }: { viewing: Viewings[number]; index: number }) => (
	<Box width="100%" padding="0.5em 0.5em 0 0.5em" boxSizing="border-box">
		<Box display="flex">
			<Typography variant="h4" flex={1}>
				{viewing.watchlist.name}
			</Typography>
			<WatchlistPreviewOptions viewing={viewing} />
		</Box>
		<Progress
			numerator={index < 0 ? viewing.watchlist.episodes.length : index}
			denominator={viewing.watchlist.episodes.length}
		/>
	</Box>
);

const WatchlistPreviewContent = ({ viewing, index: cursorIndex }: { viewing: DecoratedViewing; index: number }) => {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: viewing.watchlist.episodes.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 50,
		initialOffset: cursorIndex * 50 - 25,
		overscan: 5,
	});

	return (
		<Box ref={parentRef} flex={1} overflow="auto" width="100%" maxHeight={{ xs: "400px", sm: "unset" }}>
			<nav>
				<List
					disablePadding
					sx={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}
				>
					{virtualizer.getVirtualItems().map(({ index, start }) => (
						<Box
							key={viewing.watchlist.episodes[index].id}
							sx={{
								position: "absolute",
								top: start,
								left: 0,
								width: "100%",
								height: "50px",
							}}
						>
							<WatchlistPreviewEntry
								episode={viewing.watchlist.episodes[index]}
								viewingId={viewing.id}
								selected={cursorIndex === index}
							/>
						</Box>
					))}
				</List>
			</nav>
		</Box>
	);
};

type WatchlistPreviewEntryProps = {
	episode: DecoratedViewing["watchlist"]["episodes"][number];
	viewingId: string;
	selected: boolean;
};

const WatchlistPreviewEntry = ({ episode, viewingId, selected }: WatchlistPreviewEntryProps) => {
	const listItemRef = useRef<HTMLLIElement>(null);
	const { setCursor } = useMutationContext();
	const onClick = useCallback(() => setCursor({ viewingId, episodeId: episode.id }), [setCursor, viewingId, episode]);
	const { settings } = useUserContext();
	const colour = useColour(episode);
	const text = useMemo(
		() =>
			selected || episode.opinions[0] || !settings.isSpoilerEpisodeName
				? episode.name
				: `${episode.seriesId} ${episode.season ? episode.season + "-" : ""}${episode.production}`,
		[selected, episode, settings],
	);
	return (
		<ListItem
			disablePadding
			ref={listItemRef}
			sx={{ borderRight: "solid", borderColor: colour, height: "50px", boxSizing: "border-box" }}
		>
			<ListItemButton onClick={onClick} selected={selected} sx={{ paddingRight: "8px", position: "relative" }}>
				<ListItemText sx={{ whiteSpace: "nowrap", overflow: "hidden" }} primary={text} />
				<WatchlistPreviewEntryOptions episode={episode} viewingId={viewingId} />
			</ListItemButton>
		</ListItem>
	);
};

const WatchlistPreviewOptions = ({ viewing }: { viewing: Viewings[number] }) => {
	const controls = useViewingControls();
	// TODO it might be nice to have a confirmation dialog
	return (
		<Box>
			<Options id={`${viewing.id}-w-${viewing.watchlist.id}`}>
				<MenuItem component={Link} to={`/watchlists/${viewing.watchlist.id}`}>
					Go to watchlist
				</MenuItem>
				<MenuItem onClick={controls.pause}>
					<ListItemIcon>
						<PauseRounded fontSize="small" />
					</ListItemIcon>
					<ListItemText>Pause viewing</ListItemText>
				</MenuItem>
				<MenuItem onClick={controls.stop}>
					<ListItemIcon>
						<StopRounded fontSize="small" />
					</ListItemIcon>
					<ListItemText>Stop viewing</ListItemText>
				</MenuItem>
			</Options>
		</Box>
	);
};

const WatchlistPreviewEntryOptions = ({
	viewingId,
	episode,
}: {
	viewingId: string;
	episode: DecoratedViewing["watchlist"]["episodes"][number];
}) => (
	<Options id={`${viewingId}-ep-${episode.id}`}>
		<MenuItem
			component={Link}
			to={`/shows/${episode.seriesId.toLowerCase()}/seasons/${episode.season}/episodes/${episode.production}`}
		>
			Go to episode
		</MenuItem>
		<MenuItem component={Link} to={`/shows/${episode.seriesId.toLowerCase()}`}>
			Go to series
		</MenuItem>
	</Options>
);
