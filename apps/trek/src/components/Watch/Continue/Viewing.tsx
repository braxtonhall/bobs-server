import { Box, Card, styled, Typography } from "@mui/material";
import { LogForm } from "../../LogForm";
import { WatchlistPreview } from "./WatchlistPreview";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { EpisodeCard } from "../../EpisodeCard";
import { useMutationContext } from "./MutationContext";

type ViewingProps = {
	viewing: DecoratedViewing;
};

const StyledCard = styled(Card)(({ theme }) => ({
	marginBottom: "1em",
	animation: "fade-in 300ms",
	"@keyframes fade-in": {
		from: {
			opacity: 0,
		},
		to: {
			opacity: 1,
		},
	},
}));

export const Viewing = ({ viewing }: ViewingProps) => {
	// TODO what should happen if you are DONE???
	// TODO needs a button to just give up...
	const maybeIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === viewing.cursor);
	const index = maybeIndex >= 0 ? maybeIndex : viewing.watchlist.episodes.length;
	const current = viewing.watchlist.episodes[index];
	const { logEpisode } = useMutationContext();

	return (
		<StyledCard>
			<Box display={{ sm: "flex" }} justifyContent="right">
				<Box width={{ xs: "100%", sm: "25%" }} flex={{ sm: 1 }} order={{ xs: 0, sm: 2 }}>
					<WatchlistPreview viewing={viewing} index={index} key={viewing.id} />
				</Box>

				<Box width={{ xs: "100%", sm: "75%" }}>
					<Box sx={{ backgroundColor: "antiquewhite", padding: "1em" }}>
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
										<Typography variant="h5" component="h2">
											{current.name}
										</Typography>

										<Typography variant="body2" component="p">
											{current.abbreviation ?? current.seriesId}
											{current.abbreviation === null
												? ` Season ${current.season}, Episode ${current.production}`
												: ""}
										</Typography>

										<Typography sx={{ fontSize: 14 }}>{current.release}</Typography>
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
				</Box>
			</Box>
		</StyledCard>
	);
};
