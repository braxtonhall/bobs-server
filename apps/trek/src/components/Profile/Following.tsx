import { useProfileContext } from "../../contexts/ProfileContext";

export const Following = () => {
	const { viewer, self } = useProfileContext();
	return <>FOLLOWING</>;
};
