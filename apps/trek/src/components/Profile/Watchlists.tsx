import { useProfileContext } from "../../contexts/ProfileContext";
import { Box, Container, IconButton, Typography, useTheme } from "@mui/material";
import { api } from "../../util/api";
import { WatchlistsList } from "./WatchlistsList";
import { Link } from "react-router-dom";
import { AddRounded } from "@mui/icons-material";

export const Watchlists = () => {
	const { viewer, self } = useProfileContext();

	const theme = useTheme();

	return (
		<Container maxWidth="md">
			<Box marginTop="1em">
				<Box display="flex">
					<Typography variant="h2" color={theme.palette.text.primary} flex="1">
						{self ? "Your" : `${viewer.name}'s`} watchlists
					</Typography>
					<Box display="flex" alignItems="center">
						<IconButton color="success" aria-label="create" component={Link} to="/create-watchlist">
							<AddRounded />
						</IconButton>
					</Box>
				</Box>
				<WatchlistsList
					getWatchlists={(cursor) => api.getWatchlists.query({ viewerId: viewer.id, cursor })}
					queryKey={["profile", viewer.id]}
				/>
			</Box>
		</Container>
	);
};
