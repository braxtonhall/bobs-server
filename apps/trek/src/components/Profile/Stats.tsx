import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";

export const Stats = () => {
	const { viewer, self } = useContext(ProfileContext);
	return <>STATS</>;
};
