import { useProfileContext } from "../../contexts/ProfileContext";

export const Stats = () => {
	const { viewer, self } = useProfileContext();
	return <>STATS</>;
};
