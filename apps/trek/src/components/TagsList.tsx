import { API } from "../util/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Chip } from "@mui/material";

type TagsProcedure = (cursor?: string) => ReturnType<API["getWatchlistTags"]["query"]>;

export const TagsList = (props: { getTags: TagsProcedure; queryKey?: string[] }) => {
	const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
		queryKey: ["tags", ...(props.queryKey ?? [])],
		queryFn: ({ pageParam }) => props.getTags(pageParam),
		initialPageParam: undefined as undefined | string,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});

	return (
		<>
			{data?.pages.flatMap((page) => page.tags.map(({ name }) => <Chip key={name} label={name} />))}
			{hasNextPage ? (
				<Chip disabled={isFetching} label="Clickable" variant="outlined" onClick={() => fetchNextPage()} />
			) : (
				<></>
			)}
		</>
	);
};
