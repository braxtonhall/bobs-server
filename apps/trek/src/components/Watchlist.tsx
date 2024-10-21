import { useLoaderData } from "react-router-dom";
import { api, API } from "../util/api";
import { Box, Button, Card, CardMedia, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Episode } from "./Landing/Watch/types";

import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { AgGridReact } from "ag-grid-react";
import type { GridApi } from "ag-grid-community";
import { updateWatchlist } from "../../../../src/trek/operations/updateWatchlist";

// TODO remove
const IMG_URL = "https://media.themoviedb.org/t/p/w454_and_h254_bestv2/Asrl6u2tugWf9EJN24uhQ9zvyo6.jpg";

const Watchlist = () => {
	const { watchlist, owner } = useLoaderData() as NonNullable<Awaited<ReturnType<API["getWatchlist"]["query"]>>>;
	const [episodes, setEpisodes] = useState<Episode[]>([]);
	const settings = useMemo(() => JSON.parse(watchlist.filters), [watchlist]);

	const rowsRef = useRef<Episode[]>([]);
	const selectionRef = useRef<Episode[]>([]);

	const gridRef = useRef<{ api: GridApi<Episode> }>();

	useEffect(
		() =>
			void api.getEpisodes.query().then((episodes) => {
				// setRows(episodes); // TODO update the sorting and what's in the watchlist or whatever
				setEpisodes(episodes);
				rowsRef.current = episodes;
			}),
		[watchlist],
	);

	const saveSelection = (api: GridApi<Episode>) => {
		const selection: Episode[] = [];
		api.forEachNodeAfterFilterAndSort((node) => {
			if (node.isSelected()) {
				selection.push(node.data!);
			}
		});
		selectionRef.current = selection;
	};

	return (
		<>
			<Typography variant="h1">{watchlist.name}</Typography>
			<Typography variant="body1">{watchlist.description}</Typography>

			<Button
				onClick={() => {
					api.updateWatchlist
						.mutate({
							episodes: selectionRef.current.map(({ id }) => id),
							watchlistId: watchlist.id,
							filters: {
								filters: gridRef.current?.api.getFilterModel(),
								state: gridRef.current?.api.getColumnState(),
							},
							name: watchlist.name,
							tags: [],
							description: watchlist.description,
						})
						.then(() => alert("done"))
						.catch(console.error);
				}}
			>
				Save
			</Button>
			<Button
				onClick={() => {
					gridRef.current?.api.applyColumnState({
						state: [{ colId: "sort", sort: "asc" }],
						defaultState: { sort: null },
					});
				}}
			>
				Default Sort
			</Button>

			{episodes.length ? (
				<Box className="ag-theme-quartz" style={{ width: "100%", marginBottom: "1em" }}>
					<AgGridReact
						ref={gridRef as any}
						// 	Series	Episode	Name	Stardate	Airdate	Seen	Liked	Liked	Unseen Row	522	Last Seen Row	521	Next Unseen Row	523
						domLayout="autoHeight"
						rowData={rowsRef.current}
						onFirstDataRendered={({ api }) => {
							// TODO it would be nice to have this before the table renders
							//   also the order of the state is the order of the columns
							api.applyColumnState({
								state: settings.state,
							});
							api.setFilterModel(settings.filters);
						}}
						columnDefs={[
							{ field: "sort", hide: true, colId: "sort" },
							{
								colId: "drag",
								rowDrag: true,
								sortable: false,
								width: 145,
								cellRenderer: ({ data: episode }: { data: Episode }) => (
									<Card
										style={{
											width: "77px",
											height: "40px",
											marginRight: "0.5em",
											position: "relative",
										}}
									>
										<CardMedia
											alt={episode.name}
											image={IMG_URL}
											component="img"
											sx={{
												position: "absolute",
												top: 0,
												right: 0,
												height: "100%",
												width: "100%",
											}}
										/>
									</Card>
								),
							},
							{ field: "name", filter: true, colId: "name" },
							{
								headerName: "Series",
								valueGetter: ({ data }) => data!.abbreviation ?? data!.seriesId,
								filter: true,
								colId: "series",
							},
						]}
						onSortChanged={({ api }) => saveSelection(api)}
						onFilterChanged={({ api }) => saveSelection(api)}
						onSelectionChanged={({ api }) => saveSelection(api)}
						getRowId={(row) => row.data.id}
						onDragStarted={(event) => {
							if (event.api.getColumnState().some((column) => column.sort)) {
								const filterModel = event.api.getFilterModel();
								event.api.setFilterModel(null);
								const rows: Episode[] = [];
								event.api.forEachNodeAfterFilterAndSort((row) => rows.push(row.data!));
								event.api.setGridOption("rowData", rows);
								event.api.setFilterModel(filterModel);
								event.api.resetColumnState();
								rowsRef.current = rows;
							}
						}}
						onRowDragMove={(event) => {
							const movingNode = event.node;
							const overNode = event.overNode;

							if (movingNode !== overNode) {
								const src = (rowsRef.current as unknown[]).indexOf(movingNode?.data);
								const dst = (rowsRef.current as unknown[]).indexOf(overNode?.data);
								rowsRef.current.splice(src, 1);
								rowsRef.current.splice(dst, 0, movingNode!.data!);
								event.api.setGridOption("rowData", rowsRef.current);
								event.api.clearFocusedCell();
							}
						}}
						onRowDragLeave={(event) => event.api.setGridOption("rowData", rowsRef.current)}
						onRowDragCancel={(event) => event.api.setGridOption("rowData", rowsRef.current)}
						onRowDragEnd={({ api }) => {
							rowsRef.current = api.getGridOption("rowData")!;
							saveSelection(api);
						}}
						rowSelection={{ mode: "multiRow" }}
					/>
				</Box>
			) : (
				<>Loading</>
			)}
		</>
	);
};

export default Watchlist;
