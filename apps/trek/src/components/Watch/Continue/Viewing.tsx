import { API } from "../../../util/api";
import { Box, Card, CardMedia, Typography } from "@mui/material";
import { LogForm } from "../../LogForm";
import { WatchlistPreview } from "./WatchlistPreview";
import { DecoratedViewing } from "./mergeViewingWithContent";
import { Link } from "react-router-dom";

type ViewingProps = {
	viewing: DecoratedViewing;
	setCursor: (opts: Parameters<API["updateCursor"]["mutate"]>[0]) => void;
	logEpisode: (opts: Parameters<API["logEpisode"]["mutate"]>[0]) => void;
};

// TODO remove this
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

export const Viewing = ({ viewing, setCursor, logEpisode }: ViewingProps) => {
	// TODO what should happen if you are DONE???
	// TODO needs a button to just give up...
	const maybeIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === viewing.cursor);
	const index = maybeIndex >= 0 ? maybeIndex : viewing.watchlist.episodes.length;
	const current = viewing.watchlist.episodes[index];

	return (
		<Card style={{ marginBottom: "1em" }}>
			<Box display={{ sm: "flex" }} justifyContent="right">
				<Box width={{ xs: "100%", sm: "25%" }} flex={{ sm: 1 }} order={{ xs: 0, sm: 2 }}>
					<WatchlistPreview viewing={viewing} index={index} key={viewing.id} setCursor={setCursor} />
				</Box>

				<Box width={{ xs: "100%", sm: "75%" }}>
					<Box style={{ backgroundColor: "antiquewhite", padding: "1em" }}>
						{current ? (
							<Box key={current.id}>
								<Box display="flex" alignItems="stretch" position="relative" marginBottom="1em">
									<Card
										style={{
											width: "4em",
											marginRight: "0.5em",
											minWidth: "50px",
											position: "relative",
										}}
									>
										<Link
											to={`/shows/${current.seriesId.toLowerCase()}/seasons/${current.season}/episodes/${current.production}`}
										>
											<CardMedia
												alt={current.name}
												image={IMG_URL}
												component="img"
												sx={{
													position: "absolute",
													top: 0,
													right: 0,
													height: "100%",
													width: "100%",
												}}
											/>
										</Link>
									</Card>

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
		</Card>
	);
};
