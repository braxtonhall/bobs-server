import { useLoaderData } from "react-router-dom";

const Episode = () => {
	const { id } = useLoaderData() as { id: string };
	return (
		<>
			<p>Params: {id}</p>
		</>
	);
};

export default Episode;
