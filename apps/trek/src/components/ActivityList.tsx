import { API } from "../util/api";
import { Box, Button, Card, CardActionArea, CardContent, ThemeProvider, Typography, useTheme } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Gravatar } from "./misc/Gravatar";
import { DateTime } from "luxon";
import { ReactNode, useMemo } from "react";
import { Link } from "react-router-dom";
import { useColour } from "../hooks/useColour";
import { darken, isDark, isVeryLight, lighten, overlay } from "../util/colour";
import { darkTheme, lightTheme } from "../themes";
import { useContent } from "../hooks/useContent";
import { EpisodeHeader } from "./EpisodeHeader";

type EventsProcedure = (
	cursor?: number,
) => ReturnType<API["getAllEvents" | "getIndividualEvents" | "getFollowingEvents"]["query"]>;

type Events = Awaited<ReturnType<EventsProcedure>>["events"];
type EventTransport = Events[number];
type EventType<K extends keyof EventTransport> = NonNullable<EventTransport[K]>;

export const ActivityList = (props: { getActivity: EventsProcedure; queryKey?: string[] }) => {
	// TODO are these useful? {error, isFetchingNextPage, status}
	const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
		queryKey: ["events", ...(props.queryKey ?? [])],
		queryFn: ({ pageParam }) => props.getActivity(pageParam),
		initialPageParam: undefined as undefined | number,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});

	// TODO more virtualization!!!!!
	return (
		<>
			{data?.pages.flatMap((page) => page.events.map((event) => <Event event={event} key={event.id}></Event>))}
			{hasNextPage ? (
				<Button disabled={isFetching} onClick={() => fetchNextPage()}>
					Load more
				</Button>
			) : (
				<>You reached the beginning! Wow!</>
			)}
		</>
	);
};

const Event = ({ event }: { event: EventTransport }) => {
	if (event.watchlist) {
		// TODO should a watchlist get a colour in edit page?
		return (
			<EventCard
				time={event.time}
				title={`${event.watchlist.owner?.name ?? "Someone"} created the watchlist ${event.watchlist.name}`}
				viewer={event.watchlist.owner ?? undefined}
				to={`/watchlists/${event.watchlist.id}`}
			>
				<WatchlistEmbed watchlist={event.watchlist} />
			</EventCard>
		);
	} else if (event.follow) {
		return (
			<EventCard
				time={event.time}
				title={`${event.follow.follower.name} followed ${event.follow.followed.name}`}
				viewer={event.follow.follower}
				to={`/viewers/${event.follow.followed.id}`}
			>
				<ProfileEmbed profile={event.follow.followed} />
			</EventCard>
		);
	} else if (event.view) {
		return (
			<EventCard
				time={event.time}
				title={`${event.view.viewer.name} watched${event.view.viewedOn ? ` on ${DateTime.fromFormat(event.view.viewedOn, "yyyy-MM-dd").toLocaleString()}` : ""}`}
				viewer={event.view.viewer}
				to={`/views/${event.view.id}`}
				episodeId={event.view.episodeId}
			>
				<ViewEmbed view={event.view} />
			</EventCard>
		);
	} else if (event.startedViewing) {
		return (
			<EventCard
				time={event.time}
				title={`${event.startedViewing.viewer.name} started viewing a watchlist`}
				viewer={event.startedViewing.viewer}
				to={`/watchlists/${event.startedViewing.watchlist.id}`}
			>
				<WatchlistEmbed watchlist={event.startedViewing.watchlist} />
			</EventCard>
		);
	} else if (event.finishedViewing) {
		return (
			<EventCard
				time={event.time}
				title={`${event.finishedViewing.viewer.name} finished viewing a watchlist`}
				viewer={event.finishedViewing.viewer}
				to={`/watchlists/${event.finishedViewing.watchlist.id}`}
			>
				<WatchlistEmbed watchlist={event.finishedViewing.watchlist} />
			</EventCard>
		);
	} else if (event.viewLike) {
		return (
			<EventCard
				time={event.time}
				title={`${event.viewLike.viewer.name} liked`}
				viewer={event.viewLike.viewer}
				to={`/views/${event.viewLike.view.id}`}
			>
				{/*TODO just embed the other event card within this one?????*/}
				<ViewEmbed view={event.viewLike.view} />
			</EventCard>
		);
	} else if (event.watchlistLike) {
		return (
			<EventCard
				time={event.time}
				title={`${event.watchlistLike.viewer.name} liked`}
				viewer={event.watchlistLike.viewer}
				to={`/watchlists/${event.watchlistLike.watchlist.id}`}
			>
				<WatchlistEmbed watchlist={event.watchlistLike.watchlist} />
			</EventCard>
		);
	} else if (event.viewer) {
		// TODO should a viewer get a colour in settings?
		return (
			<EventCard
				viewer={event.viewer}
				time={event.time}
				title={`${event.viewer.name} joined bob's trek`}
				to={`/viewers/${event.viewer.id}`}
			/>
		);
	} else {
		return <>UNEXPECTED: {JSON.stringify(event)}</>;
	}
};

const ProfileEmbed = (props: { profile: EventType<"follow">["followed"] }) => <>{props.profile.name}</>;

const ViewEmbed = (props: { view: EventType<"view"> }) => {
	const theme = useTheme();
	const { episodes } = useContent();
	const episode = episodes?.[props.view.episodeId];
	const episodeColour = useColour(episode);
	const { viewTheme, finalColour } = useMemo(() => {
		const baseColour = overlay(theme.palette.background.default, episodeColour);
		const finalColour = isVeryLight(baseColour) ? darken(baseColour, 5) : lighten(baseColour, 10);
		const useDarkTheme = isDark(finalColour);
		const viewTheme = useDarkTheme ? darkTheme : lightTheme;
		return { viewTheme, finalColour };
	}, [episodeColour, theme]);
	if (episode) {
		return (
			<ThemeProvider theme={viewTheme}>
				<Card sx={{ backgroundColor: finalColour }}>
					<CardActionArea>
						<CardContent>
							<EpisodeHeader episode={episode} />
						</CardContent>
					</CardActionArea>
				</Card>
			</ThemeProvider>
		);
	} else {
		return <></>;
	}
};

const WatchlistEmbed = (props: { watchlist: Omit<EventType<"watchlist">, "owner"> }) => <>{props.watchlist.name}</>;

const EventCard = (props: {
	children?: ReactNode | ReactNode[];
	time: string;
	viewer?: EventType<"viewer">;
	title: string;
	to: string;
	episodeId?: string;
}) => {
	const { episodes } = useContent();
	const theme = useTheme();
	const episode = props.episodeId ? episodes?.[props.episodeId] ?? undefined : undefined;
	const colour = useColour(episode);
	const useDarkTheme = useMemo(() => isDark(overlay(theme.palette.background.default, colour)), [theme, colour]);
	const viewTheme = useDarkTheme ? darkTheme : lightTheme;
	return (
		<ThemeProvider theme={viewTheme}>
			<Card sx={{ marginBottom: "1em", backgroundColor: colour }}>
				<CardActionArea component={Link} to={props.to}>
					<CardContent>
						<Box display="flex">
							<Gravatar
								href={props.viewer ? `/viewers/${props.viewer.id}` : undefined}
								sx={{ width: 40, height: 40, marginRight: "1em" }}
								hash={props.viewer?.email.gravatar ?? null}
							/>
							<Box display="flex" flexDirection="column" justifyContent="center" flex="1">
								<Typography>{props.title}</Typography>
							</Box>
							<Box display="flex" flexDirection="column" justifyContent="center">
								<Typography>{DateTime.fromISO(props.time).toLocaleString()}</Typography>
							</Box>
						</Box>
						{props.children && <Box marginTop="1em">{props.children}</Box>}
					</CardContent>
				</CardActionArea>
			</Card>
		</ThemeProvider>
	);
};
