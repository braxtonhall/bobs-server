import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";

export const Followers = () => {
	const { viewer, self } = useContext(ProfileContext);
	return <>FOLLOWERS</>;
};
