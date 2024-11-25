import { Box, Button, Card, Tooltip, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import { API } from "../../util/api";
import { Link } from "react-router-dom";
import { FavoriteRounded, PlayCircleOutlineRounded, VisibilityRounded } from "@mui/icons-material";

type WatchlistsProcedure = (cursor?: string) => ReturnType<API["getWatchlists"]["query"]>;

type Watchlist = Awaited<ReturnType<WatchlistsProcedure>>["watchlists"][number];

// TODO liked, watched, currently watching
export const WatchlistEntry = ({ watchlist }: { watchlist: Watchlist }) => (
	<Card>
		<Box padding="1em" boxSizing="border-box">
			<Box display="flex">
				<Box flex={1}>
					<Link to={`/watchlists/${watchlist.id}`}>
						<Typography variant="h4">{watchlist.name}</Typography>
					</Link>
					<Typography>{watchlist.description}</Typography>
				</Box>
				{watchlist.owner ? (
					<Box textAlign="right">
						<Link to={`/viewers/${watchlist.owner.id}`}>
							<Typography variant="subtitle1">{watchlist.owner.name}</Typography>
						</Link>
						<Typography variant="subtitle2">
							{watchlist._count.entries} episode{watchlist._count.entries === 1 ? "" : "s"}
						</Typography>
						<Typography>
							{!!watchlist.viewings?.length && (
								<Tooltip title="You are watching this watchlist" arrow placement="top">
									<PlayCircleOutlineRounded />
								</Tooltip>
							)}
							{!!watchlist._count.viewings && (
								<Tooltip title="You have completed this watchlist" arrow placement="top">
									<VisibilityRounded />
								</Tooltip>
							)}
							{!!watchlist.likes?.length && (
								<Tooltip title="You liked this watchlist" arrow placement="top">
									<FavoriteRounded />
								</Tooltip>
							)}
						</Typography>
					</Box>
				) : (
					<></>
				)}
			</Box>
		</Box>
	</Card>
);

export const WatchlistsList = (props: { getWatchlists: WatchlistsProcedure; queryKey?: string[] }) => {
	// TODO are these useful? {error, isFetchingNextPage, status}
	const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
		queryKey: ["watchlists", ...(props.queryKey ?? [])],
		queryFn: ({ pageParam }) => props.getWatchlists(pageParam),
		initialPageParam: undefined as undefined | string,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});

	return (
		<>
			{data?.pages.flatMap((page) =>
				page.watchlists.map((watchlist) => <WatchlistEntry watchlist={watchlist} key={watchlist.id} />),
			)}

			{hasNextPage ? (
				<Button disabled={isFetching} onClick={() => fetchNextPage()}>
					Load more
				</Button>
			) : (
				<></>
			)}
		</>
	);
};
