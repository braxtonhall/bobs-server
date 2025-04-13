import { useProfileContext } from "../../contexts/ProfileContext";

export const Tags = () => {
	const { viewer, self } = useProfileContext();
	return <>TAGS</>;
};
