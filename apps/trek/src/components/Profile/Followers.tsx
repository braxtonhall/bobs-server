import { useProfileContext } from "../../contexts/ProfileContext";

export const Followers = () => {
	const { viewer, self } = useProfileContext();
	return <>FOLLOWERS</>;
};
