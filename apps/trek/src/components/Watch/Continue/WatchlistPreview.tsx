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
			<Box
				padding="0.5em"
				height="100%"
				width="100%"
				boxSizing="border-box"
				display="flex"
				position="absolute"
				flexDirection="column"
			>
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
}) => {
	const ref = useRef<HTMLElement>(null);
	return (
		<Box ref={ref} flex={1} overflow="auto" width="100%" maxHeight={{ xs: "400px", sm: "unset" }}>
			<Box>
				<nav>
					<List>
						{viewing.watchlist.episodes.map((episode, episodeIndex) => (
							<WatchlistPreviewEntry
								episode={episode}
								setCursor={setCursor}
								viewingId={viewing.id}
								selected={cursorIndex === episodeIndex}
								containerRef={ref}
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
	const ref = useRef<HTMLLIElement>(null);
	useEffect(() => {
		if (selected && ref.current && containerRef.current) {
			const top = ref.current.offsetTop;
			const bottom = top + ref.current.clientHeight;
			const containerTop = containerRef.current.scrollTop;
			const containerBottom = containerTop + containerRef.current.clientHeight;
			if (bottom >= containerBottom || top <= containerTop) {
				containerRef.current.scrollTo({
					top,
					behavior: "smooth",
				});
			}
		}
	}, [selected, ref, containerRef]);
	return (
		<ListItem disablePadding ref={ref}>
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
