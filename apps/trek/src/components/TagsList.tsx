import { API } from "../util/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Chip, styled } from "@mui/material";
import { MoreHorizRounded } from "@mui/icons-material";

type TagsProcedure = (cursor?: string) => ReturnType<API["getWatchlistTags"]["query"]>;

const StyledChip = styled(Chip)(() => ({
	"&:has(svg) .MuiChip-label": { padding: 0 },
	"& svg": { marginLeft: "4px !important", marginRight: "4px !important" },
	margin: "2px",
	"&:first-child": { marginLeft: 0 },
	"&:last-child": { marginRight: 0 },
}));

export const TagsList = (props: { getTags: TagsProcedure; queryKey?: string[] }) => {
	const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
		queryKey: ["tags", ...(props.queryKey ?? [])],
		queryFn: ({ pageParam }) => props.getTags(pageParam),
		initialPageParam: undefined as undefined | string,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});

	return (
		<>
			{data?.pages.flatMap((page) => page.tags.map(({ name }) => <StyledChip key={name} label={name} />))}
			{hasNextPage && (
				<StyledChip
					disabled={isFetching}
					icon={<MoreHorizRounded color="disabled" />}
					variant="outlined"
					aria-label="more"
					onClick={() => fetchNextPage()}
				/>
			)}
		</>
	);
};
