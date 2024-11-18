import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";

export const Following = () => {
	const { viewer, self } = useContext(ProfileContext);
	return <>FOLLOWING</>;
};
