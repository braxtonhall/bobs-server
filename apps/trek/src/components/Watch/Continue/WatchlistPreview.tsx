import { Viewings } from "../types";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	MenuItem,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { ExpandMoreRounded, PauseRounded, StopRounded } from "@mui/icons-material";
import { Progress } from "../../misc/Progress";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { SpaceFillingBox, SpaceFillingBoxContainer } from "../../misc/SpaceFillingBox";
import { useUserContext } from "../../../contexts/UserContext";
import { useMutationContext } from "./MutationContext";
import { useColour } from "../../../hooks/useColour";
import { Options } from "../../misc/Options";
import { useViewingControls } from "../../../contexts/ViewingControlsContext";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

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
	const containerRef = useRef<HTMLElement>(null);
	return (
		<Box ref={containerRef} flex={1} overflow="auto" width="100%" maxHeight={{ xs: "400px", sm: "unset" }}>
			<AutoSizer>
				{({ height, width }: { height: number; width: number }) => (
					<nav>
						<List width={width} height={height} itemCount={viewing.watchlist.episodes.length} itemSize={50}>
							{({ index, style }) => (
								<div key={index} style={style}>
									<WatchlistPreviewEntry
										episode={viewing.watchlist.episodes[index]}
										viewingId={viewing.id}
										selected={cursorIndex === index}
										containerRef={containerRef}
										key={viewing.watchlist.episodes[index].id}
									/>
								</div>
							)}
						</List>
					</nav>
				)}
			</AutoSizer>
		</Box>
	);
};

type WatchlistPreviewEntryProps = {
	episode: DecoratedViewing["watchlist"]["episodes"][number];
	viewingId: string;
	selected: boolean;
	containerRef: MutableRefObject<HTMLElement | null>;
};

const WatchlistPreviewEntry = ({ episode, viewingId, selected, containerRef }: WatchlistPreviewEntryProps) => {
	const initialRender = useRef(true);
	const listItemRef = useRef<HTMLLIElement>(null);
	const { setCursor } = useMutationContext();
	useEffect(() => {
		if (selected && listItemRef.current && containerRef.current) {
			const top = listItemRef.current.offsetTop;
			const bottom = top + listItemRef.current.clientHeight;
			const containerTop = containerRef.current.scrollTop;
			const containerBottom = containerTop + containerRef.current.clientHeight;
			if (bottom >= containerBottom || top <= containerTop) {
				containerRef.current.scrollTo({
					top,
					behavior: initialRender.current ? undefined : "smooth",
				});
			}
		}
		initialRender.current = false;
	}, [selected, containerRef]);
	const onClick = useCallback(() => setCursor({ viewingId, episodeId: episode.id }), [setCursor, viewingId, episode]);
	const { settings } = useUserContext();
	const colour = useColour(episode);
	return (
		<ListItem
			disablePadding
			ref={listItemRef}
			sx={{ borderRight: "solid", borderColor: colour, height: "50px", boxSizing: "border-box" }}
		>
			<ListItemButton onClick={onClick} selected={selected} sx={{ paddingRight: "8px" }}>
				<ListItemText
					primary={
						selected || episode.opinions[0] || !settings.isSpoilerEpisodeName
							? episode.name
							: `${episode.seriesId} ${episode.season ? episode.season + "-" : ""}${episode.production}`
					}
				/>
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
