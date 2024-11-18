import { useProfileContext } from "../../contexts/ProfileContext";

export const Reviews = () => {
	const { viewer, self } = useProfileContext();
	return <>REVIEWS</>;
};
