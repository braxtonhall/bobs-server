import { useProfileContext } from "../../contexts/ProfileContext";

export const Diary = () => {
	const { viewer, self } = useProfileContext();
	return <>DIARY</>;
};
