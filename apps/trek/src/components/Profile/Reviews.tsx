import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";

export const Reviews = () => {
	const { viewer, self } = useContext(ProfileContext);
	return <>REVIEWS</>;
};
