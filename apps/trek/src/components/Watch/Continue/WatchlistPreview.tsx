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
import { ExpandMoreRounded, MoreVertRounded } from "@mui/icons-material";
import { Progress } from "../../misc/Progress";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { API } from "../../../util/api";
import { MutableRefObject, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";

export const WatchlistPreview = ({
	viewing,
	index,
	setCursor,
}: {
	viewing: DecoratedViewing;
	index: number;
	setCursor: API["updateCursor"]["mutate"];
}) =>
	useMediaQuery(useTheme().breakpoints.up("sm")) ? (
		<Box height="100%" width="100%" position="relative">
			<Box height="100%" width="100%" display="flex" position="absolute" flexDirection="column">
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
			<AccordionDetails style={{ padding: 0 }}>
				<WatchlistPreviewContent viewing={viewing} index={index} setCursor={setCursor} />
			</AccordionDetails>
		</Accordion>
	);

const WatchlistPreviewHeader = ({ viewing, index }: { viewing: Viewings[number]; index: number }) => (
	<Box width="100%" padding="0.5em 0.5em 0 0.5em" boxSizing="border-box">
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
}) => {
	const containerRef = useRef<HTMLElement>(null);
	return (
		<Box ref={containerRef} flex={1} overflow="auto" width="100%" maxHeight={{ xs: "400px", sm: "unset" }}>
			<Box>
				<nav>
					<List>
						{viewing.watchlist.episodes.map((episode, episodeIndex) => (
							<WatchlistPreviewEntry
								episode={episode}
								setCursor={setCursor}
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
	setCursor: API["updateCursor"]["mutate"];
	selected: boolean;
	containerRef: MutableRefObject<HTMLElement | null>;
};

const WatchlistPreviewEntry = ({
	episode,
	viewingId,
	setCursor,
	selected,
	containerRef,
}: WatchlistPreviewEntryProps) => {
	const initialRender = useRef(true);
	const listItemRef = useRef<HTMLLIElement>(null);
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
	}, [selected, listItemRef, containerRef]);
	return (
		<ListItem disablePadding ref={listItemRef}>
			<ListItemButton
				onClick={() => setCursor({ viewingId, episodeId: episode.id })}
				selected={selected}
				style={{ paddingRight: "8px" }}
			>
				<ListItemText primary={episode.name} />
				<WatchlistPreviewEntryOptions episode={episode} viewingId={viewingId} />
			</ListItemButton>
		</ListItem>
	);
};

const WatchlistPreviewEntryOptions = ({
	viewingId,
	episode,
}: {
	viewingId: string;
	episode: DecoratedViewing["watchlist"]["episodes"][number];
}) => {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
	const handleClose = () => setAnchorEl(null);

	const iconButtonId = `${viewingId}-${episode.id}-context-button`;
	const menuId = `${viewingId}-${episode.id}-context-menu`;

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
				<MenuItem
					component={Link}
					to={`/shows/${episode.seriesId.toLowerCase()}/seasons/${episode.season}/episodes/${episode.production}`}
				>
					Go to episode
				</MenuItem>
				<MenuItem component={Link} to={`/shows/${episode.seriesId.toLowerCase()}`}>
					Go to series
				</MenuItem>
			</Menu>
		</>
	);
};
