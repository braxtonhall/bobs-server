import { Viewings } from "../types";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Menu,
	MenuItem,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { ExpandMoreRounded, MoreVertRounded, PauseRounded, StopRounded } from "@mui/icons-material";
import { Progress } from "../../misc/Progress";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { MutableRefObject, useEffect, useRef, useState, type MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { SpaceFillingBox, SpaceFillingBoxContainer } from "../../misc/SpaceFillingBox";
import { useUserContext } from "../../../contexts/UserContext";
import { useMutationContext } from "./MutationContext";

export const WatchlistPreview = ({ viewing, index }: { viewing: DecoratedViewing; index: number }) =>
	useMediaQuery(useTheme().breakpoints.up("sm")) ? (
		<SpaceFillingBoxContainer flexDirection="column">
			<WatchlistPreviewHeader viewing={viewing} index={index} />
			<SpaceFillingBox>
				<WatchlistPreviewContent viewing={viewing} index={index} />
			</SpaceFillingBox>
		</SpaceFillingBoxContainer>
	) : (
		<Accordion style={{ boxShadow: "none" }}>
			<AccordionSummary expandIcon={<ExpandMoreRounded />} style={{ paddingLeft: 0 }}>
				<WatchlistPreviewHeader viewing={viewing} index={index} />
			</AccordionSummary>
			<AccordionDetails style={{ padding: 0 }}>
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
			<Box>
				<nav>
					<List>
						{viewing.watchlist.episodes.map((episode, episodeIndex) => (
							<WatchlistPreviewEntry
								episode={episode}
								viewingId={viewing.id}
								selected={cursorIndex === episodeIndex}
								containerRef={containerRef}
								key={episode.id}
							/>
						))}
					</List>
				</nav>
			</Box>
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
	const { settings } = useUserContext();
	return (
		<ListItem disablePadding ref={listItemRef}>
			<ListItemButton
				onClick={() => setCursor({ viewingId, episodeId: episode.id })}
				selected={selected}
				style={{ paddingRight: "8px" }}
			>
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

const Options = (props: { id: string; children?: ReactNode | ReactNode[] }) => {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
	const handleClose = () => setAnchorEl(null);

	const iconButtonId = `${props.id}-context-button`;
	const menuId = `${props.id}-context-menu`;

	return (
		<>
			<IconButton
				id={iconButtonId}
				aria-controls={open ? menuId : undefined}
				aria-haspopup
				aria-expanded={open}
				size="small"
				onClick={(event) => {
					event.stopPropagation();
					handleClick(event);
				}}
			>
				<MoreVertRounded />
			</IconButton>
			<Menu
				id={menuId}
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{ "aria-labelledby": iconButtonId }}
				onClick={(event) => event.stopPropagation()}
			>
				{props.children}
			</Menu>
		</>
	);
};

const WatchlistPreviewOptions = ({ viewing }: { viewing: Viewings[number] }) => {
	return (
		<Box>
			<Options id={`${viewing.id}-w-${viewing.watchlist.id}`}>
				<MenuItem component={Link} to={`/watchlists/${viewing.watchlist.id}`}>
					Go to watchlist
				</MenuItem>
				<MenuItem>
					<PauseRounded />
					Pause viewing
				</MenuItem>
				<MenuItem>
					<StopRounded />
					Stop viewing
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
}) => {
	return (
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
};
