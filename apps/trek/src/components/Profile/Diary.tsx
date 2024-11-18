import { useContext } from "react";
import { ProfileContext } from "../../contexts/ProfileContext";

export const Diary = () => {
	const { viewer, self } = useContext(ProfileContext);
	return <>DIARY</>;
};
