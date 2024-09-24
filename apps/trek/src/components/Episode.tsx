import { useLoaderData } from "react-router-dom";

const Episode = () => {
	const params = useLoaderData();
	return <>{JSON.stringify(params)}</>;
};

export default Episode;
