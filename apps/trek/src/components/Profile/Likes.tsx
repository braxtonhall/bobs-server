import { useProfileContext } from "../../contexts/ProfileContext";

export const Likes = () => {
	const { viewer, self } = useProfileContext();
	// TODO: Watchlists, Reviews, Episodes
	return <>LIKES</>;
};
