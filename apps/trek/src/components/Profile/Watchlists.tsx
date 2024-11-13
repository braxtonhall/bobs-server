import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";
import { Container } from "@mui/material";

export const Watchlists = () => {
	const { viewer, self } = useContext(ProfileContext);

	return <Container maxWidth="md">Here go the watchlists</Container>;
};
