import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";

export const Likes = () => {
	const { viewer, self } = useContext(ProfileContext);
	return <>LIKES</>;
};
