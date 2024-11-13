import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";
import { Container } from "@mui/material";
import { api } from "../../util/api";
import { WatchlistsList } from "./WatchlistsList";

export const Watchlists = () => {
	const { viewer, self } = useContext(ProfileContext);

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
