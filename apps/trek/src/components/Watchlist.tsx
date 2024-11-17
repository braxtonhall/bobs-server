import { useLoaderData } from "react-router-dom";
import { Container } from "@mui/material";
import { API } from "../util/api";

// https://trakt.tv/users/yosarasara/lists/star-trek-sara-s-suggested-watch-order?sort=rank,asc

const Watchlist = () => {
	const { watchlist, owner } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getWatchlist"]["query"]>>>;

	// TODO:
	//  1. Like/Edit
	//  2. Tags
	//  3. Start a new viewing / see count
	//  4. Owner
	//  5. Entries

	console.log(watchlist, owner);

	return (
		<Container maxWidth="md">
			<h2>{watchlist.name}</h2>
			{watchlist.description}
		</Container>
	);
};

export default Watchlist;
