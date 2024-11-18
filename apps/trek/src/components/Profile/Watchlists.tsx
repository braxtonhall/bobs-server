import { useProfileContext } from "../../contexts/ProfileContext";
import { Container } from "@mui/material";
import { api } from "../../util/api";
import { WatchlistsList } from "./WatchlistsList";

export const Watchlists = () => {
	const { viewer, self } = useProfileContext();

	return (
		<Container maxWidth="md">
			<h2>{self ? "Your" : `${viewer.name}'s`} watchlists</h2>
			<WatchlistsList
				getWatchlists={(cursor) => api.getWatchlists.query({ viewerId: viewer.id, cursor })}
				queryKey={["profile", viewer.id]}
			/>
		</Container>
	);
};
