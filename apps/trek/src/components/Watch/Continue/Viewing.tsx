import { API } from "../../../util/api";
import { Box, Button } from "@mui/material";
import { PauseRounded, StopRounded, SkipPreviousRounded, SkipNextRounded } from "@mui/icons-material";
import { LogForm } from "../../LogForm";
import { WatchlistPreview } from "./WatchlistPreview";
import { DecoratedViewing } from "./mergeViewingWithContent";

type ViewingProps = {
	viewing: DecoratedViewing;
	setCursor: API["updateCursor"]["mutate"];
	logEpisode: API["logEpisode"]["mutate"];
};

export const Viewing = ({ viewing, setCursor, logEpisode }: ViewingProps) => {
	// TODO what should happen if you are DONE???
	// TODO needs a button to just give up...
	const maybeIndex = viewing.watchlist.episodes.findIndex(({ id }) => id === viewing.cursor);
	const index = maybeIndex >= 0 ? maybeIndex : viewing.watchlist.episodes.length;
	const current = viewing.watchlist.episodes[index];
	const last = viewing.watchlist.episodes[index - 1];
	const next = viewing.watchlist.episodes[index + 1];

	return (
		<Box display={{ sm: "flex" }} justifyContent="right">
			<Box width={{ xs: "100%", sm: "25%" }} flex={{ sm: 1 }} order={{ xs: 0, sm: 2 }}>
				<WatchlistPreview viewing={viewing} index={index} key={viewing.id} setCursor={setCursor} />
			</Box>

			<Box width={{ xs: "100%", sm: "75%" }}>
				{current ? (
					<Box marginBottom="1em" key={current.id}>
						<LogForm episode={current} logEpisode={logEpisode} key={current.id} />
					</Box>
				) : (
					<Box marginBottom="1em" marginTop="1em">
						Looks like you're done!
					</Box>
				)}

				<Box display="flex" alignItems="center" position="relative">
					<Button
						variant="outlined"
						onClick={() =>
							setCursor({
								viewingId: viewing.id,
								episodeId: last?.id ?? null,
							})
						}
						style={{}}
					>
						<SkipPreviousRounded />
					</Button>

					<Button variant="outlined" size="small" color="info">
						<PauseRounded />
					</Button>

					<Button variant="outlined" size="small" color="error">
						<StopRounded />
					</Button>

					<Button
						variant="outlined"
						onClick={() =>
							setCursor({
								viewingId: viewing.id,
								episodeId: next?.id ?? null,
							})
						}
					>
						<SkipNextRounded />
					</Button>
				</Box>
			</Box>
		</Box>
	);
};
