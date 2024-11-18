import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";

export const Tags = () => {
	const { viewer, self } = useContext(ProfileContext);
	return <>TAGS</>;
};
