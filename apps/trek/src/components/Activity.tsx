import { api, API } from "../util/api";
import { Button, Container } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";

type Events = Awaited<ReturnType<API["getAllEvents"]["query"]>>["events"];
type EventTransport = Events[number];

const Activity = () => {
	// TODO are these useful? {error, isFetchingNextPage, status}
	const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
		queryKey: ["events"], // TODO if user filters, the filter goes here too
		queryFn: ({ pageParam }) => api.getAllEvents.query(pageParam),
		initialPageParam: undefined as undefined | number,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});

	return (
		<Container maxWidth="md">
			{data?.pages.flatMap((page) => page.events.map((event) => <Event event={event} key={event.id}></Event>))}
			{hasNextPage ? (
				<Button disabled={isFetching} onClick={() => fetchNextPage()}>
					Load more
				</Button>
			) : (
				<>You reached the beginning! Wow!</>
			)}
		</Container>
	);
};

const Event = ({ event }: { event: EventTransport }) => {
	if (event.watchlist) {
		return (
			<p>
				{event.watchlist.owner?.name ?? "Someone"} created the watchlist {event.watchlist.name}
			</p>
		);
	} else if (event.follow) {
		return (
			<p>
				{event.follow.follower.name} followed {event.follow.followed.name}
			</p>
		);
	} else if (event.view) {
		return (
			<p>
				{event.view.viewer.name} watched {event.view.episode.name}
			</p>
		);
	} else if (event.startedViewing) {
		return (
			<p>
				{event.startedViewing.viewer.name} started viewing {event.startedViewing.watchlist.name}
			</p>
		);
	} else if (event.finishedViewing) {
		return (
			<p>
				{event.finishedViewing.viewer.name} finished viewing {event.finishedViewing.watchlist.name}
			</p>
		);
	} else if (event.viewLike) {
		return (
			<p>
				{event.viewLike.viewer.name} liked {event.viewLike.view.viewer.name}'s review
			</p>
		);
	} else if (event.watchlistLike) {
		return (
			<p>
				{event.watchlistLike.viewer.name} liked the watchlist {event.watchlistLike.watchlist.name}
			</p>
		);
	} else if (event.viewer) {
		return <p>{event.viewer.name} joined bob's trek</p>;
	} else {
		return <>UNEXPECTED: {JSON.stringify(event)}</>;
	}
};

export default Activity;
