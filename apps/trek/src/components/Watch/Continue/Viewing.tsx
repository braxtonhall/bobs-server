import { Box, Card, createTheme, styled, Typography, useTheme, ThemeProvider } from "@mui/material";
import { LogForm } from "../../LogForm";
import { WatchlistPreview } from "./WatchlistPreview";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { EpisodeCard } from "../../EpisodeCard";
import { useMutationContext } from "./MutationContext";
import { useColour } from "../../../hooks/useColour";
import tinycolor from "tinycolor2";
import { fadeIn } from "../../../util/fadeIn";

type ViewingProps = {
	viewing: DecoratedViewing;
};

const StyledCard = styled(fadeIn(Card))(({ theme }) => ({
	marginBottom: "1em",
}));

const darkTheme = createTheme({
	palette: {
		mode: "dark",
	},
});

const DARK_MODE_THRESHOLD = 155;

export const Viewing = ({ viewing }: ViewingProps) => {
	// TODO what should happen if you are DONE???
	const defaultTheme = useTheme();
	const maybeIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === viewing.cursor);
	const index = maybeIndex >= 0 ? maybeIndex : viewing.watchlist.episodes.length;
	const current = viewing.watchlist.episodes[index];
	const { logEpisode } = useMutationContext();
	const colour = useColour(current);
	const dark = tinycolor(colour).getBrightness() < DARK_MODE_THRESHOLD;
	const theme = dark ? darkTheme : defaultTheme;
	return (
		<StyledCard>
			<Box display={{ sm: "flex" }} justifyContent="right">
				<Box width={{ xs: "100%", sm: "25%" }} flex={{ sm: 1 }} order={{ xs: 0, sm: 2 }}>
					<WatchlistPreview viewing={viewing} index={index} key={viewing.id} />
				</Box>

				<ThemeProvider theme={theme}>
					<Box width={{ xs: "100%", sm: "75%" }} sx={{ backgroundColor: colour, padding: "1em" }}>
						{current ? (
							<Box key={current.id}>
								<Box display="flex" alignItems="stretch" position="relative" marginBottom="1em">
									<EpisodeCard episode={current} width="4em" marginRight="0.5em" minWidth="50px" />

									<Box
										sx={{
											display: { xs: "unset", md: "table-cell" },
											width: { xs: "unset", md: "100%" },
										}}
									>
										{/*TODO it would be nice if this font changed based on the show https://github.com/wrstone/fonts-startrek*/}
										<Typography variant="h5" component="h2" color={theme.palette.text.primary}>
											{current.name}
										</Typography>

										<Typography variant="body2" component="p" color={theme.palette.text.primary}>
											{current.abbreviation ?? current.seriesId}
											{current.abbreviation === null
												? ` Season ${current.season}, Episode ${current.production}`
												: ""}
										</Typography>

										<Typography sx={{ fontSize: 14 }} color={theme.palette.text.primary}>
											{current.release}
										</Typography>
									</Box>
								</Box>

								<LogForm episode={current} logEpisode={logEpisode} key={current.id} />
							</Box>
						) : (
							<Box width="200px" height="200px">
								Looks like you're done! TODO mark as finished button
							</Box>
						)}
					</Box>
				</ThemeProvider>
			</Box>
		</StyledCard>
	);
};
