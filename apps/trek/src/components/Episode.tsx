import { useLoaderData } from "react-router-dom";

const Episode = () => {
	const { id } = useLoaderData() as { id: string };
	return <>Params: {id}</>;
};

export default Episode;
