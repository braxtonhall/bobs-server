import { Box, Card, styled, useTheme, ThemeProvider } from "@mui/material";
import { LogForm } from "../../LogForm";
import { WatchlistPreview } from "./WatchlistPreview";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { useMutationContext } from "./MutationContext";
import { useColour } from "../../../hooks/useColour";
import { fadeIn } from "../../../util/fadeIn";
import { StorageKind, useStorage } from "../../../hooks/useStorage";
import { isDark, overlay } from "../../../util/colour";
import { useMemo } from "react";
import { darkTheme, lightTheme } from "../../../themes";
import { EpisodeHeader } from "../../EpisodeHeader";

type ViewingProps = {
	viewing: DecoratedViewing;
};

const StyledCard = styled(fadeIn(Card))(({ theme }) => ({
	marginBottom: "1em",
}));

// TODO something here is SLOW!!!

export const Viewing = ({ viewing }: ViewingProps) => {
	const theme = useTheme();
	const maybeIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === viewing.cursor);
	const index = maybeIndex >= 0 ? maybeIndex : viewing.watchlist.episodes.length;
	const current = viewing.watchlist.episodes[index];
	const { logEpisode } = useMutationContext();
	const colour = useColour(current);
	const useDarkTheme = useMemo(() => isDark(overlay(theme.palette.background.default, colour)), [theme, colour]);
	const viewTheme = useDarkTheme ? darkTheme : lightTheme;
	const storage = useStorage(StorageKind.StringList, viewing.id);
	return (
		<StyledCard>
			<Box display={{ sm: "flex" }} justifyContent="right">
				<Box width={{ xs: "100%", sm: "25%" }} flex={{ sm: 1 }} order={{ xs: 0, sm: 2 }}>
					<WatchlistPreview viewing={viewing} index={index} key={viewing.id} />
				</Box>

				<ThemeProvider theme={viewTheme}>
					<Box
						width={{ xs: "100%", sm: "75%" }}
						sx={{ backgroundColor: colour, padding: "1em" }}
						boxSizing="border-box"
					>
						{current ? (
							<Box key={current.id}>
								<Box marginBottom="1em">
									<EpisodeHeader episode={current} forceShowName />
								</Box>

								<LogForm episode={current} logEpisode={logEpisode} key={current.id} storage={storage} />
							</Box>
						) : (
							<Box width="200px" height="200px">
								Looks like you're done! TODO mark as finished button TODO storage.clear()
							</Box>
						)}
					</Box>
				</ThemeProvider>
			</Box>
		</StyledCard>
	);
};
