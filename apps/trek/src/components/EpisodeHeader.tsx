import { Box, Typography, useTheme } from "@mui/material";
import { EpisodeCard } from "./EpisodeCard";
import { Episode } from "../hooks/useContent";
import { useUserContext } from "../contexts/UserContext";
import { useMemo } from "react";

export const EpisodeHeader = ({ episode, forceShowName }: { episode: Episode; forceShowName?: boolean }) => {
	const theme = useTheme();
	const { settings } = useUserContext();
	const episodeName = useMemo(
		() =>
			forceShowName || episode.opinions[0] || !settings.isSpoilerEpisodeName
				? episode.name
				: `${episode.seriesId} ${episode.season ? episode.season + "-" : ""}${episode.production}`,
		[forceShowName, episode, settings],
	);

	return (
		<Box display="flex" alignItems="stretch" position="relative">
			<EpisodeCard episode={episode} width="4em" marginRight="0.5em" minWidth="50px" />

			<Box
				sx={{
					display: { xs: "unset", md: "table-cell" },
					width: { xs: "unset", md: "100%" },
				}}
			>
				{/*TODO it would be nice if this font changed based on the show https://github.com/wrstone/fonts-startrek*/}
				<Typography variant="h5" component="h2" color={theme.palette.text.primary}>
					{episodeName}
				</Typography>

				<Typography variant="body2" component="p" color={theme.palette.text.primary}>
					{episode.abbreviation ?? episode.seriesId}
					{episode.abbreviation === null ? ` Season ${episode.season}, Episode ${episode.production}` : ""}
				</Typography>

				<Typography sx={{ fontSize: 14 }} color={theme.palette.text.primary}>
					{episode.release}
				</Typography>
			</Box>
		</Box>
	);
};
