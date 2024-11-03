import { useEffect, useState } from "react";
import { api, API } from "../util/api";
import { Container } from "@mui/material";
// import { Scope } from "../../../../../src/trek/types"; // TODO?

type Events = Awaited<ReturnType<API["getEvents"]["query"]>>["events"];
type EventTransport = Events[number];

const Activity = () => {
	const [events, setEvents] = useState<Awaited<ReturnType<API["getEvents"]["query"]>>["events"]>([]);
	useEffect(() => {
		void api.getEvents.query({ scope: "everyone" as any }).then(function getRemainingSeries({ cursor, events }) {
			setEvents((existing) => {
				const newEvents = [...existing, ...events];
				const eventsById = Object.fromEntries(newEvents.map((event) => [event.id, event]));
				return Object.values(eventsById).sort((a, b) => b.id - a.id);
			});
			if (cursor) {
				void api.getEvents.query({ cursor, scope: "everyone" as any }).then(getRemainingSeries);
			}
		});
	}, []);

	return (
		<Container maxWidth="md" sx={{ typography: "body1" }}>
			{events.map((event) => (
				<Event event={event} key={event.id}></Event>
			))}
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
