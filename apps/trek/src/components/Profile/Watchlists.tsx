import { useProfileContext } from "../../contexts/ProfileContext";
import { Box, Container, Typography, useTheme } from "@mui/material";
import { api } from "../../util/api";
import { WatchlistsList } from "./WatchlistsList";

export const Watchlists = () => {
	const { viewer, self } = useProfileContext();

	const theme = useTheme();

	return (
		<Container maxWidth="md">
			<Box marginTop="1em">
				<Typography variant="h2" color={theme.palette.text.primary}>
					{self ? "Your" : `${viewer.name}'s`} watchlists
				</Typography>
				<WatchlistsList
					getWatchlists={(cursor) => api.getWatchlists.query({ viewerId: viewer.id, cursor })}
					queryKey={["profile", viewer.id]}
				/>
			</Box>
		</Container>
	);
};
